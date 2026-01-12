const { Pool } = require('pg');
require('dotenv').config();

// 개별 변수 방식을 사용하면 '!!' 같은 특수문자가 있어도 인코딩할 필요가 없어 안전합니다.
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
