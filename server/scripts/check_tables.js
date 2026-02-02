import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'gear',
    password: process.env.DB_PASSWORD || 'Tsp-2024',
    database: process.env.DB_NAME || 'gear',
};

async function check() {
    console.log('Connecting to DB with:', { ...config, password: '***' });
    try {
        const conn = await mysql.createConnection(config);
        
        console.log('\n--- Lessons Table ---');
        const [lessons] = await conn.query('DESCRIBE lessons');
        console.table(lessons);

        console.log('\n--- Lesson Steps Table ---');
        const [steps] = await conn.query('DESCRIBE lesson_steps');
        console.table(steps);
        
        console.log('\n--- Lesson Attempts Table ---');
        const [attempts] = await conn.query('DESCRIBE lesson_attempts');
        console.table(attempts);

        console.log('\n--- Users Table ---');
        const [users] = await conn.query('DESCRIBE users');
        console.table(users);

        console.log('\n--- Sectors Table ---');
        const [sectors] = await conn.query('DESCRIBE sectors');
        console.table(sectors);

        await conn.end();
    } catch (e) {
        console.error('DB Error:', e);
    }
}

check();
