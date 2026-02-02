
import bcrypt from 'bcryptjs';
import pool from '../db.js';

const testPassword = async () => {
    try {
        const email = 'boban.blagojevic@tsp.edu.rs';
        const passwordsToTest = ['Tsp-2024', 'admin123', 'admin', 'password', 'gear'];
        
        const [users] = await pool.query(
            'SELECT password FROM users WHERE email = ?',
            [email]
        );
        
        if (users.length === 0) {
            console.log('User not found');
            return;
        }

        const hash = users[0].password;
        console.log('Found hash:', hash);

        for (const password of passwordsToTest) {
            const valid = await bcrypt.compare(password, hash);
            console.log(`Password '${password}': ${valid}`);
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
};

testPassword();
