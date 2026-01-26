import pool from './server/db.js';

async function checkUsers() {
    try {
        const [users] = await pool.query('SELECT username, role FROM users');
        console.log('Users:', users);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUsers();
