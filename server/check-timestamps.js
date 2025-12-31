const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkData() {
    try {
        const res = await pool.query('SELECT insert_timestamp FROM raw_data ORDER BY insert_timestamp DESC');
        console.log('Data Timestamps:');
        res.rows.forEach(row => console.log(row.insert_timestamp));
        console.log('\nTotal rows:', res.rows.length);

        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        console.log('\nRange for "Last 24 Hours":', last24h.toISOString(), 'to', now.toISOString());

        const matchingRows = res.rows.filter(row => new Date(row.insert_timestamp) >= last24h);
        console.log('Rows matching Last 24 Hours:', matchingRows.length);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

checkData();
