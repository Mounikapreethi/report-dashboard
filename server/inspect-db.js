const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspect() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'raw_data'
            ORDER BY ordinal_position
        `);
        console.log('Columns in raw_data:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

        const firstRow = await pool.query('SELECT * FROM raw_data LIMIT 1');
        console.log('\nFirst row sample:', firstRow.rows[0]);
    } catch (err) {
        console.error('Inspection failed:', err);
    } finally {
        await pool.end();
    }
}

inspect();
