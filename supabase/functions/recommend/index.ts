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

    const prompt = `당신은 초정밀 지리 데이터 분석가입니다. 
다음 위치 인근의 포인트를 실시간 검색하여 추천해주세요: "${address}"

[최우선 지시 사항 - 정확도 500% 강화]
1. **반경 제한:** 반드시 입력된 위치에서 **직선거리 5km 이내**의 포인트만 추천하세요.
2. **좌표 엄격화:** 주소(리/번지)의 중앙 좌표를 찍지 마세요. 반드시 **실제 물과 닿아 있는 연안 좌표**를 출력하세요. (산 중턱 좌표는 즉시 오답 처리)
3. **주소-좌표 일치:** 제공하는 주소와 위도/경도가 서로 다른 장소를 가리키면 안 됩니다.
4. 검색 결과가 부실하거나 반경 5km 내에 확실한 포인트가 없다면 "${AI_CONFIG.noResultMsg}"라고만 답하세요.

[응답 형식]
JSON 형식으로만 응답:
[ { "id": 1, "name": "포인트 명칭", "address": "실제 수변 상세 주소", "lat": 위도, "lng": 경도, "reason": "추천 근거", "score": 1~100, "tags": ["태그1", "태그2"] } ]`


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



