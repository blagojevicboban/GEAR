import pool from './db.js';

async function verifyFix() {
    try {
        const connection = await pool.getConnection();

        // 1. Check if table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'workshops'");
        if (tables.length === 0) {
            console.error('FAIL: Workshop table not found.');
            process.exit(1);
        }
        console.log('PASS: Workshop table exists.');

        // 2. Insert dummy data to test Join
        // We need an existing user and model.
        const [users] = await connection.query(
            'SELECT username FROM users LIMIT 1'
        );
        const [models] = await connection.query(
            'SELECT id FROM models LIMIT 1'
        );

        if (users.length === 0 || models.length === 0) {
            console.log(
                'WARN: Cannot test full query because users or models are missing. Skipping data verification.'
            );
            process.exit(0);
        }

        const username = users[0].username;
        const modelId = models[0].id;
        const wsId = 'test-ws-' + Date.now();

        await connection.query(
            'INSERT INTO workshops (id, modelId, createdBy, status) VALUES (?, ?, ?, ?)',
            [wsId, modelId, username, 'active']
        );

        // 3. Extract the query logic from server/index.js and test it
        const [results] = await connection.query(
            `
            SELECT w.*, m.name as modelName, u.username as creatorName 
            FROM workshops w
            JOIN models m ON w.modelId = m.id
            JOIN users u ON w.createdBy = u.username
            WHERE w.status = 'active' AND w.id = ?
        `,
            [wsId]
        );

        if (results.length > 0 && results[0].id === wsId) {
            console.log('PASS: Successfully queried active workshops.');
        } else {
            console.error('FAIL: Query returned no results despite insert.');
            process.exit(1);
        }

        // Cleanup
        await connection.query('DELETE FROM workshops WHERE id = ?', [wsId]);
        console.log('PASS: Cleanup successful.');

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('FAIL: Verification script errored:', err);
        process.exit(1);
    }
}

verifyFix();
