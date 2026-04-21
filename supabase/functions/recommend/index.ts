import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { address } = await req.json()

    if (!address) {
      return new Response(JSON.stringify({ error: 'Address is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const prompt = `배스 낚시 전문가로서 다음 주소 인근의 낚시 포인트를 추천해주세요: "${address}"
추천 포인트 2곳을 선정하고, 각 포인트별로 이름, 상세 주소, 위도(lat), 경도(lng), 추천 이유(전문적인 분석 포함), 추천 점수(100점 만점), 특징 태그 3개를 포함해주세요.
반드시 아래와 같은 JSON 배열 형식으로만 응답해주세요. 다른 설명은 생략하세요:
[
  {
    "id": 1,
    "name": "포인트 이름",
    "address": "상세 주소",
    "lat": 37.1234,
    "lng": 127.1234,
    "reason": "AI의 전문적인 추천 이유 (최근 조과, 지형 특징 등)",
    "score": 95,
    "tags": ["태그1", "태그2", "태그3"]
  }
]`

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    })

    const data = await response.json()
    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]"
    
    // Extract JSON from the response (sometimes AI wraps it in markdown code blocks)
    const jsonString = aiText.replace(/```json|```/g, "").trim()
    const recommendations = JSON.parse(jsonString)

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
