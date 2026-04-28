// Supabase Edge Function: recommend (High Precision Version)
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
    "반드시 배스 낚시가 가능한 곳이어야 하며, 낚시 금지구역은 절대 제외할 것",
    "구글 지도 및 최신 지리 정보를 바탕으로 '실제 물가(연안)'에 해당하는 주소를 제공할 것",
    "산 중턱이나 도로 한복판 같은 엉뚱한 좌표를 생성하지 말 것 (위도/경도 정확도 최우선)",
    "저수지, 강, 수로, 노지 포인트를 모두 고려하되, 실제 조과가 있는 유명 포인트를 우선할 것",
    "추천 포인트는 반드시 2곳 이하로 할 것"
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const { address } = await req.json()
    
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    // Pro 모델을 사용하여 추론 능력 극대화
    const prompt = `당신은 대한민국 최고의 배스 낚시 전문가이자 지리 정보 분석가입니다. 
다음 위치 인근의 포인트를 추천해주세요: "${address}"

[지시 사항]
1. 내부 지식과 검색 알고리즘을 총동원하여 실제 낚시꾼들이 방문하는 정확한 포인트를 찾아내세요.
2. 각 포인트의 주소는 도로명 또는 지번 주소로 매우 정확해야 합니다.
3. 위도(lat)와 경도(lng)는 반드시 해당 주소의 실제 '물가(수변)' 지점이어야 합니다. 산이나 건물 위가 되어서는 안 됩니다.
4. 규칙: ${AI_CONFIG.rules.join(', ')}
5. 만약 위 조건을 만족하는 신뢰할 수 있는 데이터를 찾기 어렵다면, 거짓 정보를 생성하지 말고 반드시 "${AI_CONFIG.noResultMsg}"라고만 응답하세요.

[응답 형식]
JSON 형식으로만 응답:
[ { "id": 1, "name": "포인트 명칭", "address": "정확한 주소", "lat": 위도, "lng": 경도, "reason": "구체적인 추천 이유", "score": 1~100, "tags": ["태그1", "태그2"] } ]`

    // Pro 모델을 최우선으로 사용 (추론 능력 및 정확도 향상)
    const preferredModels = ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"];
    
    let lastError = "";
    for (const model of preferredModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1 } // 낮은 온도로 설정하여 정확도(결정론적 응답) 향상
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
            continue;
          }
        }
        lastError = data.error?.message || "Unknown error";
      } catch (e) {
        lastError = e.message;
      }
    }

    throw new Error(`AI 분석 결과 생성 실패: ${lastError}`);

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})


