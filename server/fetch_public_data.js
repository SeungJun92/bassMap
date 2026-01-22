const axios = require('axios');
const db = require('./db');
const https = require('https');
const xml2js = require('xml2js');
require('dotenv').config();

const SERVICE_KEY = process.env.PUBLIC_DATA_KEY ? process.env.PUBLIC_DATA_KEY.trim() : '';

const axiosInstance = axios.create({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 10000,
    // 500 에러가 나도 응답 본문을 읽기 위해 설정
    validateStatus: (status) => true
});

const parser = new xml2js.Parser({ explicitArray: false });

async function fetchAndMerge() {
    console.log('🚀 Starting FINAL SYNC (Deep Debug Mode)...');
    if (!SERVICE_KEY) return console.error('❌ No Key found.');

    const reservoirMap = new Map();

    // ==========================================
    // [PART 1] Plan A: 전국저수지및댐표준데이터
    // ==========================================
    console.log('1️⃣ Trying Plan A (Standard Data)...');
    try {
        // 인코딩 문제 방지를 위해 URL 전체를 수동 조립 (encodeURIComponent 사용 안 함)
        const rawUrl = `http://api.data.go.kr/openapi/tn_pubr_public_reservoirs_dams_api?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1000&type=json`;
        const res = await axiosInstance.get(rawUrl);

        if (typeof res.data === 'string' && res.data.includes('SERVICE KEY IS NOT REGISTERED')) {
            console.log('   ⚠️ Plan A: Key Registration Error (System says invalid key)');
        } else if (res.data?.response?.body?.items) {
            let items = res.data.response.body.items;
            if (!Array.isArray(items)) items = [items];

            // DEBUG: Log the first item structure
            if (items.length > 0) {
                console.log('   🔍 DEBUG: First Item Structure:', JSON.stringify(items[0], null, 2));
            }

            items.forEach(item => {
                // Try multiple possible field names (Added fcltNm based on actual API response)
                const name = item.fcltNm || item.fcltyNm || item.fclty_nm || item.fac_name || item.name;

                if (name) {
                    reservoirMap.set(name.trim(), {
                        name: name.trim(),
                        lat: parseFloat(item.latitude || item.lat || 0),
                        lng: parseFloat(item.longitude || item.lng || item.lon || 0),
                        water_level: '정보없음'
                    });
                }
            });
            console.log(`   ✅ Plan A Successful! (${reservoirMap.size} locations)`);
        } else {
            console.log(`   🔸 Plan A Response: ${JSON.stringify(res.data).substring(0, 150)}`);
        }
    } catch (e) {
        console.log(`   ❌ Plan A Request Error: ${e.message}`);
        if (e.response) {
            console.log(`   > Status: ${e.response.status}`);
            console.log(`   > Data: ${JSON.stringify(e.response.data).substring(0, 200)}`);
        }
    }

    // ==========================================
    // [PART 2] Plan B: 한국농어촌공사 (Plan A 실패 시)
    // ==========================================
    if (reservoirMap.size === 0) {
        console.log('2️⃣ Trying Plan B (KRC API)...');
        try {
            // 이번에는 인코딩을 한 번 시도한 URL로도 시도
            const encodedKey = encodeURIComponent(SERVICE_KEY);
            const urlB = `http://apis.data.go.kr/B552149/reservoirInfo/reservoirInfoList?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1000`;
            const resB = await axiosInstance.get(urlB);

            if (resB.status !== 200 || (typeof resB.data === 'string' && resB.data.includes('<returnAuthMsg>'))) {
                console.log(`   ⚠️ Plan B Auth Fail. Status: ${resB.status}`);
                console.log(`   > Server Message: ${String(resB.data).substring(0, 200)}`);
            } else {
                const parsedB = await parser.parseStringPromise(resB.data);
                let itemsB = parsedB.response?.body?.items?.item || [];
                if (!Array.isArray(itemsB)) itemsB = [itemsB];

                if (itemsB.length > 0) {
                    itemsB.forEach(item => {
                        if (item.lat && item.lon) {
                            reservoirMap.set(item.fac_name.trim(), {
                                name: item.fac_name.trim(),
                                lat: parseFloat(item.lat),
                                lng: parseFloat(item.lon),
                                water_level: '정보없음'
                            });
                        }
                    });
                    console.log(`   ✅ Plan B Successful! (${reservoirMap.size} locations)`);
                }
            }
        } catch (e) {
            console.log(`   ❌ Plan B Request Error: ${e.message}`);
        }
    }

    if (reservoirMap.size === 0) {
        console.log("\n❌ ALL PLANS FAILED.");
        console.log("--------------------------------------------------");
        console.log("💡 [조치 방법]");
        console.log("1. 공공데이터포털 마이페이지에서 '인증키(Encoding)'를 복사해서 .env에 넣었는지 확인하세요.");
        console.log("2. 방금 승인을 받았다면 시스템 동기화에 최대 1시간이 걸립니다.");
        console.log("3. 웹 사이트 하단의 [미리보기] 버튼을 눌러서 데이터가 브라우저에 나오는지 확인해 보세요.");
        console.log("--------------------------------------------------");
        return;
    }

    // ==========================================
    // [PART 3] 수위 정보 매칭 및 DB 저장 (생략/유지)
    // ==========================================
    // ... (이후 로직은 위치 데이터가 있어야 작동하므로 위가 성공하면 진행됩니다)
    console.log(`3️⃣ Merging with Water Levels and Saving to DB...`);
    // (매칭 로직 동일하게 수행 후 DB 저장)
    console.log(`3️⃣ Merging with Water Levels and Saving to DB...`);

    // [3-1] Try to fetch Water Level Data (Optional)
    try {
        const levelUrl = `http://apis.data.go.kr/B552149/reserviorWaterLevel/reservoirlevel/list?serviceKey=${SERVICE_KEY}&pageNo=1&numOfRows=1000`;
        const resL = await axiosInstance.get(levelUrl);

        // Check if it looks like XML before parsing
        if (resL.data && typeof resL.data === 'string' && resL.data.trim().startsWith('<')) {
            const parsedL = await parser.parseStringPromise(resL.data);
            let levelItems = parsedL.response?.body?.items?.item || [];
            if (!Array.isArray(levelItems)) levelItems = [levelItems];

            levelItems.forEach(item => {
                const name = item.fac_name.trim();
                const target = reservoirMap.get(name) || reservoirMap.get(name.split('(')[0]);
                if (target) target.water_level = `${item.rate}%`;
            });
            console.log(`   💧 Water Level synced for matching locations.`);
        } else {
            console.log(`   ⚠️ Water Level API payload is not XML (Skipping levels). Sample: ${String(resL.data).substring(0, 50)}...`);
        }
    } catch (e) {
        console.log(`   ⚠️ Water Level Fetch Failed (Skipping levels): ${e.message}`);
    }

    // [3-2] Always Save to DB
    try {
        if (reservoirMap.size === 0) {
            console.log('   ⚠️ No data to save.');
            return;
        }

        await db.query('TRUNCATE TABLE reservoirs RESTART IDENTITY');

        let savedCount = 0;
        for (const res of reservoirMap.values()) {
            // Ensure coordinates are valid (not 0,0) if you strictly want valid valid points, 
            // but for now we save everything found in Plan A.
            await db.query('INSERT INTO reservoirs (name, lat, lng, water_level) VALUES ($1, $2, $3, $4)',
                [res.name, res.lat, res.lng, res.water_level]);
            savedCount++;
        }
        console.log(`🎉 Final Success! Saved ${savedCount} items to DB.`);
    } catch (e) {
        console.error(`❌ DB Save Error: ${e.message}`);
    }
}

fetchAndMerge();
