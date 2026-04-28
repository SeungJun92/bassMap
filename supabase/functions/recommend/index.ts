// Supabase Edge Function: recommend (Advanced AI Recommendation)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- AI CONFIGURATION (Modify these rules as needed) ---
const AI_CONFIG = {
  radiusKm: 10,
  targetFish: "배스(Bass)",
  maxPoints: 2,
  noResultMsg: "근처에는 마땅한 추천 장소가 없습니다.",
  rules: [
    "입력된 주소 반경 10km 이내의 포인트만 추천할 것",
    "반드시 배스 낚시가 가능한 곳이어야 함",
    "낚시 금지구역은 절대 추천하지 말 것 (지자체 공고 기준)",
    "저수지, 강, 수로, 노지 포인트를 모두 고려할 것",
    "정확한 도로명 주소 또는 지번 주소를 제공할 것",
    "추천 포인트는 반드시 2곳 이하로 할 것"
  ]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    const { address } = await req.json()
    
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");

    const prompt = `당신은 대한민국 최고의 배스 낚시 전문가입니다. 
다음 주소 인근의 포인트를 추천해주세요: "${address}"

[추천 규칙]
${AI_CONFIG.rules.map((rule, i) => `${i+1}. ${rule}`).join('\n')}
7. 만약 위 조건(특히 10km 이내 및 낚시 가능 여부)을 만족하는 포인트를 찾기 어렵다면, 억지로 추천하지 말고 반드시 "${AI_CONFIG.noResultMsg}"라고만 응답하세요.

[응답 형식]
조건에 맞는 포인트가 있다면 반드시 아래 JSON 형식으로만 응답하세요:
[ { "id": 1, "name": "포인트이름", "address": "정확한주소", "lat": 위도, "lng": 경도, "reason": "추천이유(조과, 지형특징 등)", "score": 1~100점, "tags": ["태그1", "태그2"] } ]

만약 포인트가 없다면 위 JSON 형식을 무시하고 "${AI_CONFIG.noResultMsg}" 문구만 출력하세요.`

    const preferredModels = ["gemini-2.0-flash", "gemini-flash-latest", "gemini-pro-latest"];
    
    let lastError = "";
    for (const model of preferredModels) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        const data = await response.json();
        if (response.ok) {
          const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
          
          // 결과 없음 메시지 체크
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
            // JSON 파싱 실패시 다시 시도하거나 에러 처리
            continue;
          }
        }
        lastError = data.error?.message || "Unknown error";
      } catch (e) {
        lastError = e.message;
      }
    }

    throw new Error(`AI 분석 중 오류가 발생했습니다. (${lastError})`);

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

