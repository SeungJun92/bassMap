const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        const res = await pool.query('SELECT COUNT(*) FROM reservoirs');
        console.log(`Total reservoirs: ${res.rows[0].count}`);

        const sample = await pool.query('SELECT name, water_level FROM reservoirs LIMIT 5');
        console.log('Sample data:');
        console.table(sample.rows);
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await pool.end();
    }
}

check();
