const fastify = require('fastify')({ logger: true });
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT,
});

fastify.register(require('@fastify/cors'), { origin: '*' });

fastify.get('/api/filter-values', async (request, reply) => {
    const query = `
        SELECT 
            jsonb_agg(DISTINCT json_payload->'meta'->>'externalId') as "externalId",
            jsonb_agg(DISTINCT json_payload->'data'->'Submission'->'Insured'->>'InsuredName') as "insuredName",
            jsonb_agg(DISTINCT json_payload->'data'->'Submission'->'Insured'->'Address'->>'State') as "state",
            jsonb_agg(DISTINCT json_payload->'meta'->'status'->>'State') as "status",
            jsonb_agg(DISTINCT json_payload->'data'->'Request'->'Products'->>'MguOfferingType') as "offeringType",
            jsonb_agg(DISTINCT json_payload->'meta'->'data'->'Submission'->>'SubmissionID') as "submissionId",
            jsonb_agg(DISTINCT json_payload->'meta'->'data'->'Policy'->>'PolicyNumber') as "policyNumber",
            jsonb_agg(DISTINCT json_payload->'data'->'Request'->>'TotalPremium') as "totalPremium"
        FROM raw_data
    `;
    try {
        const result = await pool.query(query);
        // Clean up nulls from the arrays
        const row = result.rows[0];
        Object.keys(row).forEach(key => {
            if (row[key]) row[key] = row[key].filter(v => v !== null);
            else row[key] = [];
        });
        return row;
    } catch (err) {
        fastify.log.error(err);
        reply.status(500).send({ error: 'Failed to fetch filter values' });
    }
});

fastify.get('/api/reports', async (request, reply) => {
    const {
        page = 1, pageSize = 50, timeRange, startDate, endDate,
        externalId, insuredName, state, status, offeringType, submissionId, policyNumber, totalPremium
    } = request.query;
    const limit = parseInt(pageSize) || 50;
    const offset = (parseInt(page) - 1) * limit;

    let query = 'SELECT * FROM raw_data WHERE 1=1';
    const values = [];
    let paramIdx = 1;

    // Time filtering
    if (timeRange === '12h') { query += " AND insert_timestamp >= NOW() - INTERVAL '12 hours'"; }
    else if (timeRange === '24h') { query += " AND insert_timestamp >= NOW() - INTERVAL '24 hours'"; }
    else if (startDate && endDate) {
        query += ` AND insert_timestamp BETWEEN $${paramIdx++} AND $${paramIdx++}`;
        values.push(startDate, endDate);
    }

    // Helper for multi-select filters
    const addMultiSelectFilter = (field, path) => {
        if (field) {
            const items = field.split(',');
            if (items.length === 1) {
                query += ` AND ${path} = $${paramIdx++}`;
                values.push(items[0]);
            } else {
                const placeholders = items.map(() => `$${paramIdx++}`).join(',');
                query += ` AND ${path} IN (${placeholders})`;
                values.push(...items);
            }
        }
    };

    addMultiSelectFilter(externalId, "json_payload->'meta'->>'externalId'");
    addMultiSelectFilter(insuredName, "json_payload->'data'->'Submission'->'Insured'->>'InsuredName'");
    addMultiSelectFilter(state, "json_payload->'data'->'Submission'->'Insured'->'Address'->>'State'");
    addMultiSelectFilter(status, "json_payload->'meta'->'status'->>'State'");
    addMultiSelectFilter(offeringType, "json_payload->'data'->'Request'->'Products'->>'MguOfferingType'");
    addMultiSelectFilter(submissionId, "json_payload->'meta'->'data'->'Submission'->>'SubmissionID'");
    addMultiSelectFilter(policyNumber, "json_payload->'meta'->'data'->'Policy'->>'PolicyNumber'");
    addMultiSelectFilter(totalPremium, "json_payload->'data'->'Request'->>'TotalPremium'");

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    try {
        const countResult = await pool.query(countQuery, values);
        const totalCount = parseInt(countResult.rows[0].count);

        query += ` ORDER BY insert_timestamp DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
        values.push(limit, offset);

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
