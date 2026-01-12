const db = require('./db');

// 대한민국 주요 낚시 포인트 (약 80여 곳)
const reservoirs = [
    // [경기/인천]
    { name: '신갈저수지 (기흥)', lat: 37.2285, lng: 127.0911, weather: '맑음', wind: '2m/s', water_level: '85%', live_users: 25, ai_score: 83, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '송전저수지', lat: 37.1264, lng: 127.2132, weather: '흐림', wind: '3m/s', water_level: '78%', live_users: 40, ai_score: 88, ai_color: 'text-green-400', ai_label: '매우 좋음' },
    { name: '고삼저수지', lat: 37.0855, lng: 127.2877, weather: '비', wind: '1m/s', water_level: '90%', live_users: 35, ai_score: 92, ai_color: 'text-green-400', ai_label: '최고' },
    { name: '평택호 (당거리)', lat: 36.9537, lng: 126.9741, weather: '맑음', wind: '4m/s', water_level: '92%', live_users: 50, ai_score: 80, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '남양호', lat: 37.0601, lng: 126.8642, weather: '흐림', wind: '2m/s', water_level: '80%', live_users: 15, ai_score: 75, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '왕송저수지', lat: 37.3197, lng: 126.9515, weather: '맑음', wind: '1m/s', water_level: '88%', live_users: 10, ai_score: 65, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '백운저수지', lat: 37.3622, lng: 127.0051, weather: '맑음', wind: '1m/s', water_level: '85%', live_users: 12, ai_score: 70, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '물왕저수지', lat: 37.3885, lng: 126.8377, weather: '흐림', wind: '3m/s', water_level: '75%', live_users: 8, ai_score: 60, ai_color: 'text-yellow-400', ai_label: '보통' },

    // [강원]
    { name: '춘천호 (고탄)', lat: 37.9739, lng: 127.6894, weather: '맑음', wind: '0m/s', water_level: '82%', live_users: 5, ai_score: 95, ai_color: 'text-green-400', ai_label: '최고' },
    { name: '의암호', lat: 37.8500, lng: 127.7000, weather: '맑음', wind: '1m/s', water_level: '85%', live_users: 10, ai_score: 81, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '소양호', lat: 37.9500, lng: 127.8000, weather: '맑음', wind: '4m/s', water_level: '50%', live_users: 3, ai_score: 48, ai_color: 'text-red-400', ai_label: '나쁨' },
    { name: '파로호 (상무룡)', lat: 38.0833, lng: 127.8166, weather: '흐림', wind: '2m/s', water_level: '85%', live_users: 4, ai_score: 91, ai_color: 'text-green-400', ai_label: '매우 좋음' },
    { name: '학마을저수지', lat: 38.1667, lng: 127.2500, weather: '구름많음', wind: '2m/s', water_level: '78%', live_users: 5, ai_score: 74, ai_color: 'text-yellow-400', ai_label: '보통' },

    // [충청]
    { name: '예당저수지', lat: 36.6578, lng: 126.7725, weather: '맑음', wind: '2m/s', water_level: '75%', live_users: 30, ai_score: 88, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '삽교호 (운정)', lat: 36.8647, lng: 126.8378, weather: '흐림', wind: '4m/s', water_level: '88%', live_users: 15, ai_score: 60, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '대청호 (문의)', lat: 36.4674, lng: 127.4851, weather: '맑음', wind: '1m/s', water_level: '80%', live_users: 8, ai_score: 85, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '충주호 (제일钓)', lat: 37.0055, lng: 128.0261, weather: '흐림', wind: '2m/s', water_level: '72%', live_users: 12, ai_score: 92, ai_color: 'text-green-400', ai_label: '매우 좋음' },
    { name: '백곡저수지', lat: 36.8833, lng: 127.4333, weather: '흐림', wind: '3m/s', water_level: '80%', live_users: 18, ai_score: 84, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '초평저수지', lat: 36.8333, lng: 127.5333, weather: '맑음', wind: '2m/s', water_level: '85%', live_users: 22, ai_score: 89, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '고복저수지', lat: 36.6333, lng: 127.2333, weather: '구름많음', wind: '1.5m/s', water_level: '70%', live_users: 5, ai_score: 72, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '송악저수지', lat: 36.7167, lng: 127.0500, weather: '비', wind: '4m/s', water_level: '92%', live_users: 1, ai_score: 40, ai_color: 'text-red-400', ai_label: '나쁨' },
    { name: '대호만', lat: 37.0333, lng: 126.5000, weather: '맑음', wind: '5m/s', water_level: '88%', live_users: 40, ai_score: 94, ai_color: 'text-green-400', ai_label: '매우 좋음' },
    { name: '탑정호', lat: 36.1833, lng: 127.1833, weather: '맑음', wind: '2m/s', water_level: '75%', live_users: 14, ai_score: 86, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '논산저수지', lat: 36.1500, lng: 127.1500, weather: '흐림', wind: '3m/s', water_level: '60%', live_users: 9, ai_score: 63, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '금강 (생초)', lat: 35.2501, lng: 127.1500, weather: '맑음', wind: '1m/s', water_level: '65%', live_users: 12, ai_score: 75, ai_color: 'text-yellow-400', ai_label: '보통' },

    // [전라]
    { name: '장성호', lat: 35.3585, lng: 126.7645, weather: '비', wind: '6m/s', water_level: '95%', live_users: 0, ai_score: 30, ai_color: 'text-red-400', ai_label: '매우 나쁨' },
    { name: '나주호', lat: 34.9255, lng: 126.8451, weather: '맑음', wind: '1m/s', water_level: '78%', live_users: 10, ai_score: 87, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '담양호', lat: 35.3782, lng: 127.0041, weather: '맑음', wind: '2m/s', water_level: '80%', live_users: 5, ai_score: 78, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '영산강 (승촌보)', lat: 35.1000, lng: 126.7500, weather: '구름많음', wind: '3m/s', water_level: '70%', live_users: 8, ai_score: 68, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '섬진강 (구례)', lat: 35.2000, lng: 127.4500, weather: '맑음', wind: '2m/s', water_level: '60%', live_users: 6, ai_score: 80, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '옥정호', lat: 35.6000, lng: 127.1833, weather: '맑음', wind: '2m/s', water_level: '65%', live_users: 6, ai_score: 79, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '부도탑', lat: 35.8000, lng: 127.0000, weather: '흐림', wind: '1m/s', water_level: '50%', live_users: 0, ai_score: 55, ai_color: 'text-yellow-400', ai_label: '보통' },

    // [경상]
    { name: '안동호 (주진교)', lat: 36.6366, lng: 128.8465, weather: '비', wind: '5m/s', water_level: '65%', live_users: 3, ai_score: 45, ai_color: 'text-red-400', ai_label: '나쁨' },
    { name: '임하호', lat: 36.5293, lng: 128.8878, weather: '맑음', wind: '2m/s', water_level: '70%', live_users: 6, ai_score: 72, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '합천호 (봉산)', lat: 35.6173, lng: 128.0202, weather: '흐림', wind: '2m/s', water_level: '55%', live_users: 7, ai_score: 82, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '낙동강 (강정고령보)', lat: 35.8457, lng: 128.4687, weather: '구름많음', wind: '1m/s', water_level: '60%', live_users: 5, ai_score: 70, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '화목 저수지', lat: 35.6894, lng: 128.7891, weather: '맑음', wind: '1m/s', water_level: '90%', live_users: 2, ai_score: 65, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '오태저수지', lat: 36.3888, lng: 128.2386, weather: '맑음', wind: '2m/s', water_level: '85%', live_users: 4, ai_score: 76, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '가창저수지', lat: 35.7979, lng: 128.6367, weather: '흐림', wind: '1m/s', water_level: '80%', live_users: 8, ai_score: 70, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '운문댐', lat: 35.6792, lng: 128.9482, weather: '맑음', wind: '3m/s', water_level: '75%', live_users: 3, ai_score: 68, ai_color: 'text-yellow-400', ai_label: '보통' },

    // [기타 추가 포인트]
    { name: '마전저수지', lat: 37.7812, lng: 126.7812, weather: '맑음', wind: '1m/s', water_level: '82%', live_users: 2, ai_score: 60, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '장척저수지', lat: 35.3129, lng: 129.2138, weather: '흐림', wind: '2m/s', water_level: '80%', live_users: 5, ai_score: 75, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '명지지', lat: 36.5684, lng: 128.6923, weather: '비', wind: '4m/s', water_level: '90%', live_users: 1, ai_score: 40, ai_color: 'text-red-400', ai_label: '나쁨' },
    { name: '성주댐', lat: 35.8821, lng: 128.1882, weather: '맑음', wind: '2m/s', water_level: '70%', live_users: 4, ai_score: 78, ai_color: 'text-green-400', ai_label: '좋음' },
];

async function seed() {
    try {
        console.log('Creating table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS reservoirs (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                lat DECIMAL(10, 6) NOT NULL,
                lng DECIMAL(10, 6) NOT NULL,
                weather VARCHAR(50),
                wind VARCHAR(50),
                water_level VARCHAR(50),
                live_users INTEGER DEFAULT 0,
                ai_score INTEGER DEFAULT 0,
                ai_color VARCHAR(50),
                ai_label VARCHAR(50)
            );
        `);

        console.log('Clearing old data...');
        await db.query('TRUNCATE TABLE reservoirs RESTART IDENTITY;');

        console.log(`Inserting ${reservoirs.length} reservoir records (Comprehensive List)...`);
        for (const res of reservoirs) {
            await db.query(`
                INSERT INTO reservoirs (name, lat, lng, weather, wind, water_level, live_users, ai_score, ai_color, ai_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [res.name, res.lat, res.lng, res.weather, res.wind, res.water_level, res.live_users, res.ai_score, res.ai_color, res.ai_label]);
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
