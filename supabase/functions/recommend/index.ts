// Supabase Edge Function: recommend (Optimized for Flash & High Precision)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AI_CONFIG = {
  radiusKm: 5,
  targetFish: "배스(Bass)",
  maxPoints: 2,
  noResultMsg: "반경 5km 이내에는 신뢰할 수 있는 추천 장소가 없습니다.",
  rules: [
    "반드시 입력 주소 반경 5km 이내만 추천할 것",
    "낚시 금지구역은 절대 제외할 것",
    "행정구역(면/리)의 중심점 좌표를 대충 찍지 말 것",
    "위도/경도는 반드시 실제 물가(Shoreline) 10m 이내여야 함",
    "산 속이나 물에서 먼 곳은 무조건 제외할 것"
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const { address } = await req.json()
    
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const prompt = `당신은 낚시꾼에게 정확한 지번 주소를 안내하는 '고정밀 데이터 가이드'입니다. 
다음 위치 인근의 포인트를 실시간 검색하여 추천해주세요: "${address}"

[엄격한 품질 규칙 - 반드시 준수]
1. **결과 개수:** 반드시 가장 확실한 포인트 **딱 2곳**만 선정하세요. (3개 이상 절대 금지)
2. **중복 금지:** 두 추천 장소는 반드시 **서로 다른 위치와 주소**를 가져야 합니다. 동일한 주소를 중복해서 사용하는 것은 치명적인 오류입니다.
3. **주소 정밀도:** 주소를 '장성읍 용강리'처럼 뭉뚱그리지 마세요. 반드시 **'장성읍 용강리 123-4'**와 같이 **상세 지번(번지수) 또는 도로명 번호**가 포함된 전체 주소를 검색해서 제공해야 합니다.
4. **데이터 일치:** 모든 포인트는 실제 명칭과 상세 주소가 검색 결과와 100% 일치해야 합니다.
5. **수변 좌표:** 모든 위도/경도는 반드시 해당 상세 주소의 **물가 바로 앞**이어야 합니다.

[응답 형식]
JSON 형식으로만 응답:
[ { "id": 1, "name": "포인트 명칭", "address": "상세 지번이 포함된 전체 주소", "lat": 위도, "lng": 경도, "reason": "추천 근거", "score": 1~100, "tags": ["태그1", "태그2"] } ]`



    // 대시보드 기반 모델 리스트 (가장 확실한 명칭으로 재설정)
    const preferredModels = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
    
    let errors: string[] = [];
    for (const model of preferredModels) {
      try {
        console.log(`[TRY] High-Precision Mapping Attempt: ${model}`);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            tools: [{ google_search: {} }],
            generationConfig: { 
              temperature: 0,
              topP: 1,
              topK: 1
            }
          }),
        });



        const data = await response.json();
        if (response.ok) {
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
          
          if (aiText.includes(AI_CONFIG.noResultMsg)) {
            return new Response(JSON.stringify({ recommendations: [], message: AI_CONFIG.noResultMsg }), { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          }

          const jsonMatch = aiText.match(/\[[\s\S]*\]/)
          const jsonString = jsonMatch ? jsonMatch[0] : aiText.trim()
          
          try {
            const recommendations = JSON.parse(jsonString)
            return new Response(JSON.stringify({ recommendations }), { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
          } catch (e) {
            errors.push(`${model}: JSON Parse Error`);
            continue;
          }
        }
        
        const errorMsg = data.error?.message || "Unknown error";
        console.error(`[ERROR] ${model}: ${errorMsg}`);
        errors.push(`${model}: ${errorMsg}`);
      } catch (e) {
        errors.push(`${model}: ${e.message}`);
      }
    }

    throw new Error(`모든 모델 호출 실패 (할당량 500회인 3.1 Flash Lite 우선 시도됨): \n${errors.join('\n')}`);



  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})



