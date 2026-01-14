const db = require('./db');

async function createTable() {
    try {
        console.log('Creating personal_points table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS personal_points (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                address TEXT,
                lat DECIMAL(10, 6) NOT NULL,
                lng DECIMAL(10, 6) NOT NULL,
                cost VARCHAR(100),
                water_level VARCHAR(50),
                parking VARCHAR(100),
                rig TEXT,
                action TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Table personal_points created successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createTable();
