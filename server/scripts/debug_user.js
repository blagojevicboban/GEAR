
import pool from '../db.js';

const checkUser = async () => {
    try {
        const email = 'boban.blagojevic@tsp.edu.rs';
        console.log(`Checking user with email: ${email}`);
        const [users] = await pool.query(
            'SELECT id, username, email, role, language, password FROM users WHERE email = ?',
            [email]
        );
        console.log('User found:', users);
    } catch (err) {
        console.error('Error checking user:', err);
    } finally {
        process.exit();
    }
};

checkUser();
