import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const { Client } = pg;

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT name, lat, lng, water_level FROM reservoirs LIMIT 5');
        console.log('\n=== First 5 Reservoirs in DB ===');
        console.log(res.rows);
        console.log('\n');
    } catch (e) {
        console.error('ERROR:', e.message);
    } finally {
        await client.end();
        process.exit();
    }
}

run();
