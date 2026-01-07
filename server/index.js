const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MOCK_RESERVOIRS = [
    { id: 1, name: '충주호 (제일钓)', lat: 37.0055, lng: 128.0261, weather: '흐림', wind: '2m/s', waterLevel: '72%', liveUsers: 12, aiScore: 92, aiColor: 'text-green-400', aiLabel: '매우 좋음' },
    { id: 2, name: '안동호 (주진교)', lat: 36.6366, lng: 128.8465, weather: '비', wind: '5m/s', waterLevel: '65%', liveUsers: 3, aiScore: 45, aiColor: 'text-red-400', aiLabel: '나쁨' },
    { id: 3, name: '대청호 (문의)', lat: 36.4674, lng: 127.4851, weather: '맑음', wind: '1m/s', waterLevel: '80%', liveUsers: 8, aiScore: 85, aiColor: 'text-green-400', aiLabel: '좋음' },
    { id: 4, name: '평택호 (당거리)', lat: 36.9537, lng: 126.9741, weather: '맑음', wind: '3m/s', waterLevel: '90%', liveUsers: 25, aiScore: 78, aiColor: 'text-yellow-400', aiLabel: '보통' },
    { id: 5, name: '삽교호 (운정)', lat: 36.8647, lng: 126.8378, weather: '흐림', wind: '4m/s', waterLevel: '88%', liveUsers: 15, aiScore: 60, aiColor: 'text-yellow-400', aiLabel: '보통' },
    { id: 6, name: '예당지 (대회장)', lat: 36.6578, lng: 126.7725, weather: '맑음', wind: '2m/s', waterLevel: '75%', liveUsers: 30, aiScore: 88, aiColor: 'text-green-400', aiLabel: '좋음' },
    { id: 10, name: '합천호 (봉산)', lat: 35.6173, lng: 128.0202, weather: '흐림', wind: '2m/s', waterLevel: '55%', liveUsers: 7, aiScore: 82, aiColor: 'text-green-400', aiLabel: '좋음' }
];

// Search endpoint
app.get('/api/reservoirs', async (req, res) => {
    const { q } = req.query;
    try {
        let query = 'SELECT * FROM reservoirs';
        let params = [];

        if (q) {
            query += ' WHERE name LIKE $1';
            params.push(`%${q}%`);
        }

        const result = await db.query(query, params);

        const mappedResults = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            lat: parseFloat(row.lat),
            lng: parseFloat(row.lng),
            weather: row.weather,
            wind: row.wind,
            waterLevel: row.water_level,
            liveUsers: row.live_users,
            aiScore: row.ai_score,
            aiColor: row.ai_color,
            aiLabel: row.ai_label
        }));

        res.json(mappedResults);
    } catch (err) {
        console.error('Database error, falling back to mock data:', err.message);
        // Fallback for demo purposes
        let results = MOCK_RESERVOIRS;
        if (q) {
            results = MOCK_RESERVOIRS.filter(r => r.name.includes(q));
        }
        res.json(results);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
