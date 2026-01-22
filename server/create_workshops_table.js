import pool from './db.js';

async function createWorkshopsTable() {
    try {
        const connection = await pool.getConnection();
        console.log('Creating workshops table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS workshops (
                id VARCHAR(50) PRIMARY KEY,
                modelId VARCHAR(50),
                createdBy VARCHAR(100),
                status ENUM('active', 'ended') DEFAULT 'active',
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (modelId) REFERENCES models(id) ON DELETE CASCADE,
                FOREIGN KEY (createdBy) REFERENCES users(username) ON DELETE CASCADE
            )
        `);
        console.log('Workshops table created successfully!');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Failed to create table:', err);
        process.exit(1);
    }
}

createWorkshopsTable();
