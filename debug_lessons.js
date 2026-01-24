import pool from './server/db.js';

async function checkLessons() {
    try {
        const [lessons] = await pool.query('SELECT id, title, image_url FROM lessons');
        console.log('--- Lessons in DB ---');
        console.table(lessons);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLessons();
