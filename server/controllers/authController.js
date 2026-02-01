import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { getSetting } from '../services/settingsService.js';

export const register = async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    try {
        const allowPublic = await getSetting('allow_public_registration', 'true');
        if (allowPublic === 'false') {
            return res.status(403).json({ error: 'Public registration is disabled' });
        }

        const id = 'user-' + Date.now();
        const userRole = role === 'admin' ? 'student' : role || 'student';
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, hashedPassword, userRole]
        );
        res.json({ id, username, email, institution, role: userRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [username]
        );

        if (users.length > 0) {
            const user = users[0];
            let valid = await bcrypt.compare(password, user.password);

            if (!valid && password === user.password) {
                console.log(`Migrating user ${user.email} to hashed password`);
                const newHash = await bcrypt.hash(password, 10);
                await pool.query('UPDATE users SET password = ? WHERE id = ?', [
                    newHash,
                    user.id,
                ]);
                valid = true;
            }

            if (valid) {
                const { password: _, ...userData } = user;
                res.json(userData);
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error details:', {
            message: err.message,
            stack: err.stack,
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage
        });
        res.status(500).json({ 
            error: 'Login failed', 
            details: process.env.NODE_ENV === 'development' ? err.message : undefined 
        });
    }
};
