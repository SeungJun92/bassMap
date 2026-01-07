const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

        // Transform keys to camelCase for frontend consistency if needed, 
        // or just return as is. The frontend expects:
        // { id, name, lat, lng, weather, wind, waterLevel, liveUsers, aiScore, aiColor, aiLabel }
        // Postgres returns snake_case by default. Let's map it.

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
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
