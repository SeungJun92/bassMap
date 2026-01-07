const db = require('./db');

const reservoirs = [
    { name: '충주호 (제일钓)', lat: 37.0055, lng: 128.0261, weather: '흐림', wind: '2m/s', water_level: '72%', live_users: 12, ai_score: 92, ai_color: 'text-green-400', ai_label: '매우 좋음' },
    { name: '안동호 (주진교)', lat: 36.6366, lng: 128.8465, weather: '비', wind: '5m/s', water_level: '65%', live_users: 3, ai_score: 45, ai_color: 'text-red-400', ai_label: '나쁨' },
    { name: '대청호 (문의)', lat: 36.4674, lng: 127.4851, weather: '맑음', wind: '1m/s', water_level: '80%', live_users: 8, ai_score: 85, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '평택호 (당거리)', lat: 36.9537, lng: 126.9741, weather: '맑음', wind: '3m/s', water_level: '90%', live_users: 25, ai_score: 78, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '삽교호 (운정)', lat: 36.8647, lng: 126.8378, weather: '흐림', wind: '4m/s', water_level: '88%', live_users: 15, ai_score: 60, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '예당지 (대회장)', lat: 36.6578, lng: 126.7725, weather: '맑음', wind: '2m/s', water_level: '75%', live_users: 30, ai_score: 88, ai_color: 'text-green-400', ai_label: '좋음' },
    { name: '낙동강 (강정고령보)', lat: 35.8457, lng: 128.4687, weather: '구름많음', wind: '1m/s', water_level: '60%', live_users: 5, ai_score: 70, ai_color: 'text-yellow-400', ai_label: '보통' },
    { name: '춘천호 (고탄)', lat: 37.9739, lng: 127.6894, weather: '맑음', wind: '0m/s', water_level: '82%', live_users: 2, ai_score: 95, ai_color: 'text-green-400', ai_label: '최고' },
    { name: '장성호 (슬로프)', lat: 35.3585, lng: 126.7645, weather: '비', wind: '6m/s', water_level: '95%', live_users: 0, ai_score: 30, ai_color: 'text-red-400', ai_label: '매우 나쁨' },
    { name: '합천호 (봉산)', lat: 35.6173, lng: 128.0202, weather: '흐림', wind: '2m/s', water_level: '55%', live_users: 7, ai_score: 82, ai_color: 'text-green-400', ai_label: '좋음' }
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

        console.log('Inserting new data...');
        for (const res of reservoirs) {
            await db.query(`
                INSERT INTO reservoirs (name, lat, lng, weather, wind, water_level, live_users, ai_score, ai_color, ai_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [res.name, res.lat, res.lng, res.weather, res.wind, res.water_level, res.live_users, res.ai_score, res.ai_color, res.ai_label]);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
