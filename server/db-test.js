const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function test() {
    console.log('Testing connection with config:', {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('Success! Connection established at:', res.rows[0].now);
        
        const tableCheck = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'raw_data')");
        console.log('Table raw_data exists:', tableCheck.rows[0].exists);
        
        if (tableCheck.rows[0].exists) {
            const count = await pool.query('SELECT COUNT(*) FROM raw_data');
            console.log('Rows in raw_data:', count.rows[0].count);
        }
    } catch (err) {
        console.error('Connection failed:', err.message);
        console.error(err);
    } finally {
        await pool.end();
    }
}

test();
