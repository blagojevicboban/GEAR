import pool from './db.js';

const createTableQuery = `
CREATE TABLE IF NOT EXISTS scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(255) NOT NULL,
    model_id VARCHAR(255) NOT NULL,
    time_seconds FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const run = async () => {
    try {
        await pool.query(createTableQuery);
        console.log('Scores table created successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error creating scores table:', err);
        process.exit(1);
    }
};

run();
