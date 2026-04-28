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

    const prompt = `당신은 대한민국 최고의 배스 낚시 전문가이자, 오차 없는 지리 데이터 분석가입니다. 
다음 위치 인근의 포인트를 추천해주세요: "${address}"

[절대 규칙 - 위반 시 무효]
1. 모든 추천 포인트는 실제 존재하는 장소여야 하며, 주소와 좌표가 1m의 오차도 없이 일치해야 합니다.
2. 당신의 답변은 낚시꾼의 안전과 법적 준수(낚시 금지구역)에 직결됩니다. 불확실한 정보는 절대 제공하지 마세요.
3. 반드시 반경 ${AI_CONFIG.radiusKm}km 이내의 포인트여야 합니다.
4. 만약 데이터가 부족하거나 좌표가 불확실하다면 억지로 추천하지 말고 반드시 "${AI_CONFIG.noResultMsg}"라고만 답변하세요.

[응답 형식]
아래 JSON 형식으로만 응답하세요:
[ { "id": 1, "name": "포인트 명칭", "address": "상세 주소", "lat": 위도(실제 수변), "lng": 경도(실제 수변), "reason": "추천 이유", "score": 1~100, "tags": ["태그1", "태그2"] } ]`

    // Flash 모델을 최우선으로 사용하여 사용량 확보 (1.5 Flash가 가장 안정적임)
    const preferredModels = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro", "gemini-2.0-flash"];
    
    let lastError = "";
    for (const model of preferredModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              temperature: 0.1, // 창의성 배제, 사실성 위주
              topP: 0.8,
              topK: 10
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
            continue;
          }
        }
        lastError = data.error?.message || "Unknown error";
      } catch (e) {
        lastError = e.message;
      }
    }

    throw new Error(`분석 실패: 할당량 초과 또는 서버 오류 (${lastError})`);

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})



