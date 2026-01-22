const { Client } = require('pg');
require('dotenv').config({ path: './server/.env' });

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
});

async function run() {
    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM reservoirs');
        process.stdout.write(`COUNT:${res.rows[0].count}`);
    } catch (e) {
        process.stdout.write(`ERROR:${e.message}`);
    } finally {
        await client.end();
        process.exit();
    }
}
run();
