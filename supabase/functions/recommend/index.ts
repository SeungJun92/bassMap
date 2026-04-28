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

[검색 및 분석 지침]
1. 반드시 Google 검색을 사용하여 해당 지역의 최신 배스 낚시 조과와 포인트 정보를 확인하세요.
2. 추천하려는 장소의 '정확한 주소'와 '수변(연안) 좌표'를 구글 지도와 대조하여 검증하세요.
3. 규칙: ${AI_CONFIG.rules.join(', ')}
4. 검색 결과가 불확실하거나, 해당 지역에 10km 이내의 적절한 포인트가 없다면 절대 거짓말하지 말고 "${AI_CONFIG.noResultMsg}"라고만 응답하세요.

[응답 형식]
JSON 형식으로만 응답:
[ { "id": 1, "name": "포인트 명칭", "address": "실제 검색된 상세 주소", "lat": 위도, "lng": 경도, "reason": "실제 조과 및 지형 근거", "score": 1~100, "tags": ["태그1", "태그2"] } ]`

    // 대시보드에서 확인된 500회 할당량 모델을 최우선으로 설정
    const preferredModels = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
    
    let errors: string[] = [];
    for (const model of preferredModels) {
      try {
        console.log(`[TRY] Attempting model with Google Search: ${model}`);
        
        // v1beta와 v1 두 가지 엔드포인트를 모두 고려하여 시도
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            contents: [{ parts: [{ text: prompt }] }],
            // 실시간 검색 기능(Grounding) 활성화
            tools: [{ google_search_retrieval: {} }],
            generationConfig: { 
              temperature: 0, // 가장 정확하고 일관된 결과
              topP: 0.95,
              topK: 40
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



