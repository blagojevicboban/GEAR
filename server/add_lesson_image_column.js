import pool from './db.js';

async function addLessonImageColumn() {
    try {
        const connection = await pool.getConnection();
        console.log('Adding image_url column to lessons table...');

        // Check if column exists, if not add it
        // Simpler: Just try to add it, ignore error if duplicate, or use IF NOT EXISTS logic if specific DB supports it.
        // MariaDB/MySQL ALTER TABLE usually errors if exists.
        // Let's check columns first.
        const [columns] = await connection.query("SHOW COLUMNS FROM lessons LIKE 'image_url'");
        if (columns.length === 0) {
            await connection.query('ALTER TABLE lessons ADD COLUMN image_url VARCHAR(500) DEFAULT NULL');
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

addLessonImageColumn();
