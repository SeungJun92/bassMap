// Supabase Edge Function: recommend (Optimized for Flash & High Precision)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const AI_CONFIG = {
  radiusKm: 10,
  targetFish: "배스(Bass)",
  maxPoints: 2,
  noResultMsg: "근처에는 마땅한 추천 장소가 없습니다.",
  rules: [
    "입력된 주소 반경 10km 이내의 포인트만 추천할 것",
    "낚시 금지구역(상수원 보호구역 등)은 절대 제외할 것",
    "주소는 반드시 '전라남도 장성군...'과 같이 상세 지번이나 도로명까지 포함할 것",
    "위도/경도 좌표는 반드시 해당 주소의 실제 '물가'여야 함 (산, 들판, 도로 절대 금지)",
    "조과가 증명된 유명 포인트 또는 유효한 노지/수로 포인트 위주로 선정할 것"
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const { address } = await req.json()
    
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const prompt = `당신은 실시간 지리 데이터와 낚시 정보를 분석하는 전문가입니다. 
다음 위치 인근의 포인트를 '실시간 검색'을 통해 추천해주세요: "${address}"

[필수 준수 사항 - 위반 시 무효]
1. **추천 개수:** 반드시 가장 조과가 좋고 확실한 포인트 **딱 2곳**만 선정하세요.
2. **지리적 정확도:** 추천하는 장소는 반드시 '실제 물가(Shoreline)'에 접해 있어야 합니다. 산 속이나 물에서 떨어진 도로는 절대 안 됩니다.
3. **검증:** Google 검색을 통해 해당 장소가 현재 낚시가 가능한지, 최근 조과 정보가 있는지 확인하세요.
4. **거리:** 입력된 주소 반경 10km 이내여야 하며, 이를 벗어나면 "${AI_CONFIG.noResultMsg}"라고만 답하세요.

[응답 형식]
JSON 형식으로만 응답:
[ { "id": 1, "name": "포인트 명칭", "address": "실제 수변 상세 주소", "lat": 위도, "lng": 경도, "reason": "실제 조과 및 지형 근거", "score": 1~100, "tags": ["태그1", "태그2"] } ]`

    // 대시보드 기반 모델 리스트 (가장 확실한 명칭으로 재설정)
    const preferredModels = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
    
    let errors: string[] = [];
    for (const model of preferredModels) {
      try {
        console.log(`[TRY] Attempting high-precision model: ${model}`);
        
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



