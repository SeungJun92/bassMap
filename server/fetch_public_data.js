const axios = require('axios');
const db = require('./db');
const https = require('https');
require('dotenv').config(); // 환경변수 로드

// 사용자 제공 인증키 (.env에서 로드)
const SERVICE_KEY = process.env.PUBLIC_DATA_KEY;

if (!SERVICE_KEY) {
    console.error("❌ Error: PUBLIC_DATA_KEY is missing in .env file.");
    process.exit(1);
}

// API URL 정의
const SPEC_API_URL = 'http://apis.data.go.kr/B552149/reservoirInfo/reservoirInfoList';
const LEVEL_API_URL = 'http://apis.data.go.kr/B552149/reservoirWaterLevel/reservoirWaterLevelList';

// SSL 인증서 문제 무시 (공공데이터포털 구형 서버 호환용)
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
});

async function fetchAndMerge() {
    try {
        console.log('🚀 Starting Data Sync Process...');

        // [Step 1] 제원정보(위치) 가져오기
        console.log('1️⃣ Fetching Reservoir Specifications (Location)...');
        const specResponse = await axiosInstance.get(SPEC_API_URL, {
            params: {
                serviceKey: SERVICE_KEY,
                pageNo: 1,
                numOfRows: 4000,
                type: 'json'
            }
        });

        const specItems = specResponse.data?.response?.body?.items?.item || [];
        if (specItems.length === 0) throw new Error('No Specs Data Found. Check your Service Key or API Status.');
        console.log(`   > Found ${specItems.length} locations.`);

        const reservoirMap = new Map();
        specItems.forEach(item => {
            if (item.lat && item.lon) {
                reservoirMap.set(item.fac_code, {
                    name: item.fac_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                    addr: item.addr,
                    full_water: item.full_water,
                    water_level: '정보없음'
                });
            }
        });

        // [Step 2] 수위정보(저수율) 가져오기
        console.log('2️⃣ Fetching Water Levels (Real-time)...');
        const levelResponse = await axiosInstance.get(LEVEL_API_URL, {
            params: {
                serviceKey: SERVICE_KEY,
                pageNo: 1,
                numOfRows: 4000,
                type: 'json'
            }
        });

        const levelItems = levelResponse.data?.response?.body?.items?.item || [];
        console.log(`   > Found ${levelItems.length} water level records.`);

        // [Step 3] 데이터 병합 (Merge)
        let matchCount = 0;
        levelItems.forEach(item => {
            if (reservoirMap.has(item.fac_code)) {
                const res = reservoirMap.get(item.fac_code);
                if (item.rate) {
                    res.water_level = `${item.rate}%`;
                    matchCount++;
                }
            }
        });
        console.log(`   > Merged water levels for ${matchCount} reservoirs.`);

        // [Step 4] DB 저장
        console.log('3️⃣ Saving to Database...');
        await db.query('TRUNCATE TABLE reservoirs RESTART IDENTITY;');

        let insertCount = 0;
        const batch = Array.from(reservoirMap.values());

        for (const res of batch) {
            const weather = ['맑음', '구름많음', '흐림'][Math.floor(Math.random() * 3)];
            const wind = `${Math.floor(Math.random() * 4)}m/s`;
            const users = Math.floor(Math.random() * 20);
            const score = res.water_level !== '정보없음' ?
                Math.floor(parseFloat(res.water_level)) + 10 : 50;

            let label = '보통';
            let color = 'text-yellow-400';
            if (score >= 80) { label = '좋음'; color = 'text-green-400'; }
            if (score < 40) { label = '나쁨'; color = 'text-red-400'; }

            try {
                await db.query(`
                    INSERT INTO reservoirs 
                    (name, lat, lng, weather, wind, water_level, live_users, ai_score, ai_color, ai_label)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                `, [res.name, res.lat, res.lng, weather, wind, res.water_level, users, score, color, label]);
                insertCount++;
            } catch (err) {
                // Ignore duplicates or errors
            }
        }

        console.log(`🎉 Successfully synced ${insertCount} reservoirs with water level info!`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Sync Failed:', error.message);
        if (error.response) {
            console.log('API Response:', JSON.stringify(error.response.data).substring(0, 200) + '...');
        }
        process.exit(1);
    }
}

fetchAndMerge();
