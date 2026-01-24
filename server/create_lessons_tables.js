import pool from './db.js';

async function createLessonsTables() {
    try {
        const connection = await pool.getConnection();
        console.log('Creating lessons tables...');

        // 1. Create lessons table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS lessons (
                id VARCHAR(50) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                sector_id VARCHAR(50),
                author_id VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
                FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
            )
        `);
        console.log('Table "lessons" created (or exists).');

        // 2. Create lesson_steps table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS lesson_steps (
                id VARCHAR(50) PRIMARY KEY,
                lesson_id VARCHAR(50) NOT NULL,
                step_order INT NOT NULL,
                title VARCHAR(255),
                content TEXT,
                model_id VARCHAR(50),
                hotspot_id VARCHAR(50),
                FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
                FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE SET NULL,
                FOREIGN KEY (hotspot_id) REFERENCES hotspots(id) ON DELETE SET NULL
            )
        `);
        console.log('Table "lesson_steps" created (or exists).');

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('Failed to create tables:', err);
        process.exit(1);
    }
}

createLessonsTables();
