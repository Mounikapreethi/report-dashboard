const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT,
});

fastify.register(require('@fastify/cors'), { origin: '*' });

fastify.get('/api/reports', async (request, reply) => {
    const { page = 1, pageSize = 50, timeRange, startDate, endDate, everid, externalid, submissionID, status } = request.query;
    const limit = parseInt(pageSize) || 50;
    const offset = (parseInt(page) - 1) * limit;

    let query = 'SELECT * FROM raw_data WHERE 1=1';
    const values = [];
    let paramIdx = 1;

    if (timeRange === '12h') { query += " AND created_at >= NOW() - INTERVAL '12 hours'"; }
    else if (timeRange === '24h') { query += " AND created_at >= NOW() - INTERVAL '24 hours'"; }
    else if (startDate && endDate) {
        query += ` AND created_at BETWEEN $${paramIdx++} AND $${paramIdx++}`;
        values.push(startDate, endDate);
    }

    if (everid) { query += ` AND everid ILIKE $${paramIdx++}`; values.push(`%${everid}%`); }
    if (externalid) { query += ` AND externalid ILIKE $${paramIdx++}`; values.push(`%${externalid}%`); }
    if (submissionID) { query += ` AND json_payload->>'submissionID' ILIKE $${paramIdx++}`; values.push(`%${submissionID}%`); }
    if (status) { query += ` AND json_payload->>'status' ILIKE $${paramIdx++}`; values.push(`%${status}%`); }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await pool.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count);

    query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    values.push(limit, offset);

    try {
        const result = await pool.query(query, values);
        return { data: result.rows, pagination: { total: totalCount, page: parseInt(page), pageSize: limit, totalPages: Math.ceil(totalCount / limit) } };
    } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'Database query failed' });
    }
});

fastify.listen({ port: 5000, host: '0.0.0.0' }, (err) => {
    if (err) { fastify.log.error(err); process.exit(1); }
    console.log('Server running on port 5000');
});
