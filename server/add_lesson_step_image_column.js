import pool from './db.js';

async function addStepImageColumn() {
    try {
        const connection = await pool.getConnection();
        console.log('Adding image_url column to lesson_steps table...');

        const [columns] = await connection.query("SHOW COLUMNS FROM lesson_steps LIKE 'image_url'");
        if (columns.length === 0) {
            await connection.query('ALTER TABLE lesson_steps ADD COLUMN image_url VARCHAR(500) DEFAULT NULL');
            console.log('Column image_url added.');
        } else {
            console.log('Column image_url already exists.');
        }

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Failed to update table:', err);
        process.exit(1);
    }
}

addStepImageColumn();
