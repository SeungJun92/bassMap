const axios = require('axios');
const db = require('./db');
const https = require('https');
const xml2js = require('xml2js');
require('dotenv').config();

const SERVICE_KEY = process.env.PUBLIC_DATA_KEY;

// SSL 무시
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
});

const parser = new xml2js.Parser({ explicitArray: false });

async function fetchAndMerge() {
    console.log('🚀 Starting FINAL SYNC (Standard Data + Water Level)...');

    // ==========================================
    // [PART 1] 1. 전국저수지및댐표준데이터 (위치 정보)
    // End Point: https://api.data.go.kr/openapi/tn_pubr_public_reservoirs_dams_api
    // ==========================================
    const SPEC_URL = 'http://api.data.go.kr/openapi/tn_pubr_public_reservoirs_dams_api';
    const reservoirMap = new Map();

    console.log(`1️⃣ Fetching Specs from: ${SPEC_URL}`);
    try {
        // serviceKey는 axios params로 보내면 자동 인코딩되어 에러가 날 수 있으므로 URL에 직접 포함
        // HTTPS에서 ENOTFOUND가 뜨는 경우가 있어 다시 HTTP로 시도 (첫 시도에서 응답은 왔으므로)
        const specFullUrl = `${SPEC_URL}?serviceKey=${SERVICE_KEY.trim()}&pageNo=1&numOfRows=1000&type=json`;
        console.log(`   > Target URL: ${specFullUrl.substring(0, 60)}... (Key hidden)`);

        const specRes = await axiosInstance.get(specFullUrl);
        console.log(`   > Response Status: ${specRes.status}`);

        // 응답 구조 확인
        let items = specRes.data?.response?.body?.items;

        // 데이터가 없거나 에러 메시지가 온 경우
        if (!items) {
            const resultMsg = specRes.data?.response?.header?.resultMsg;
            console.log(`   ⚠️ API Msg: ${resultMsg || JSON.stringify(specRes.data)}`);
            if (resultMsg?.includes('REGISTERED')) {
                console.log('   ⏳ (Key still syncing...)');
            }
        } else {
            if (!Array.isArray(items)) items = [items];
            console.log(`   ✅ Plan A Success! Found ${items.length} locations.`);

            items.forEach(item => {
                // 표준데이터 필드: fcltyNm, latitude, longitude
                const name = item.fcltyNm.trim();
                reservoirMap.set(name, {
                    name: name,
                    lat: parseFloat(item.latitude),
                    lng: parseFloat(item.longitude),
                    water_level: '정보없음' // 일단 없음으로 초기화
                });
            });
        }

    } catch (e) {
        console.log(`   ❌ Spec API Error: ${e.message}`);
    }

    // 만약 표준데이터 실패 시 -> 농어촌공사 API(B552149) 시도 (Plan B)
    if (reservoirMap.size === 0) {
        console.log('   👉 Trying Plan B (KRC API)...');
        try {
            const URL_B = 'http://apis.data.go.kr/B552149/reservoirInfo/reservoirInfoList';
            const resB = await axiosInstance.get(`${URL_B}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=3000&type=xml`);
            const parsedB = await parser.parseStringPromise(resB.data);
            let itemsB = parsedB.response?.body?.items?.item || [];
            if (!Array.isArray(itemsB)) itemsB = [itemsB];

            if (itemsB.length > 0) {
                console.log(`   ✅ Plan B Success! Found ${itemsB.length} locations.`);
                itemsB.forEach(item => {
                    if (item.lat && item.lon) {
                        reservoirMap.set(item.fac_name.trim(), {
                            name: item.fac_name,
                            lat: parseFloat(item.lat),
                            lng: parseFloat(item.lon),
                            water_level: '정보없음'
                        });
                    }
                });
            }
        } catch (e) {
            console.log(`   ❌ Plan B Failed too.`);
        }
    }


    if (reservoirMap.size === 0) {
        console.log("❌ CRITICAL: No location data found. Waiting for Key activation.");
        return;
    }


    // ==========================================
    // [PART 2] 2. 한국농어촌공사 수위정보 (저수율)
    // End Point: https://apis.data.go.kr/B552149/reserviorWaterLevel
    // 중요 오타 반영: reserviorWaterLevel
    // ==========================================
    const LEVEL_BASE = 'http://apis.data.go.kr/B552149/reserviorWaterLevel';

    // 사용자님이 성공한 미리보기 패턴: .../reserviorWaterLevel/reservoirlevel/
    // (끝에 list 메소드가 없어서 404가 났을 수 있으니, list를 빼거나 reservoirlevel/list 등을 시도)
    // 가장 유력한 전체 목록 조회 주소: /reservoirlevel/list

    const LEVEL_URL = `${LEVEL_BASE}/reservoirlevel/list`;
    console.log(`2️⃣ Fetching Levels from: ${LEVEL_URL}`);

    try {
        const levelFullUrl = `${LEVEL_URL}?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=3000&type=xml`;
        const levelRes = await axiosInstance.get(levelFullUrl);
        const parsedLevel = await parser.parseStringPromise(levelRes.data);

        let levelItems = parsedLevel.response?.body?.items?.item || [];
        if (!Array.isArray(levelItems)) levelItems = [levelItems];

        console.log(`   > Found ${levelItems.length} water level records.`);

        let matched = 0;
        levelItems.forEach(item => {
            const name = item.fac_name.trim();
            const cleanName = name.split('(')[0].trim();

            // 이름으로 매칭
            let target = reservoirMap.get(name) || reservoirMap.get(cleanName);

            if (target && item.rate) {
                target.water_level = `${item.rate}%`;
                matched++;
            }
        });
        console.log(`   ✅ Merged levels for ${matched} reservoirs.`);

    } catch (e) {
        console.log(`   ⚠️ Level API Warning: ${e.message}`);
        // 404가 뜨면 주소 문제 -> 내일 브라우저에서 'list'가 붙는지 확인 필요
    }


    // ==========================================
    // [PART 3] DB 저장
    // ==========================================
    console.log(`3️⃣ Saving ${reservoirMap.size} records to DB...`);
    try {
        await db.query('TRUNCATE TABLE reservoirs RESTART IDENTITY;');

        let saved = 0;
        // 중복 좌표 제거용
        const uniqueKeys = new Set();

        for (const res of reservoirMap.values()) {
            const key = `${res.lat.toFixed(4)},${res.lng.toFixed(4)}`;
            if (uniqueKeys.has(key)) continue;
            uniqueKeys.add(key);

            // 랜덤값 채우기
            const weather = ['맑음', '구름많음', '흐림'][Math.floor(Math.random() * 3)];
            const wind = `${Math.floor(Math.random() * 4)}m/s`;
            const users = Math.floor(Math.random() * 20);
            const rateVal = parseFloat(res.water_level) || 50;
            const score = res.water_level !== '정보없음' ? Math.floor(rateVal) + 10 : 50;
            const label = score >= 80 ? '좋음' : '보통';
            const color = score >= 80 ? 'text-green-400' : 'text-yellow-400';

            await db.query(`
                INSERT INTO reservoirs 
                (name, lat, lng, weather, wind, water_level, live_users, ai_score, ai_color, ai_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [res.name, res.lat, res.lng, weather, wind, res.water_level, users, score, color, label]);
            saved++;
        }
        console.log(`🎉 Mission Complete! DB updated with ${saved} reservoirs.`);

    } catch (e) {
        console.error(`❌ DB Error: ${e.message}`);
    }
}

fetchAndMerge();
