import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { getSetting } from '../services/settingsService.js';

export const register = async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    try {
        const allowPublic = await getSetting(
            'allow_public_registration',
            'true'
        );
        if (allowPublic === 'false') {
            return res
                .status(403)
                .json({ error: 'Public registration is disabled' });
        }

        const id = 'user-' + Date.now();
        const userRole = role === 'admin' ? 'student' : role || 'student';
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role, language) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, hashedPassword, userRole, 'en']
        );
        res.json({
            id,
            username,
            email,
            institution,
            role: userRole,
            language: 'en',
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const [users] = await pool.query(
            'SELECT * FROM users WHERE email = ? OR username = ?',
            [username, username]
        );

        console.log(
            `[AUTH] Login attempt: ${username} (len: ${username?.length}). Found: ${users.length > 0}`
        );

        if (users.length > 0) {
            const user = users[0];
            console.log(
                `[AUTH] User ID: ${user.id}, DB Email: ${user.email} (len: ${user.email?.length})`
            );

            let valid = false;

            // 1. Try bcrypt comparison first (Standard path)
            try {
                valid = await bcrypt.compare(password, user.password);
            } catch (e) {
                // If bcrypt fails (e.g. invalid salt/hash format), it might be plain text
                console.log(
                    '[AUTH] Bcrypt compare error (likely plain text):',
                    e.message
                );
            }

            // 2. Fallback: Check for Plain Text (Legacy/Migration path)
            if (!valid && password === user.password) {
                console.log(
                    `[AUTH] Plain text match found for ${user.username}. Migrating to hash.`
                );

                // Auto-migrate to secure hash
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
                console.log(`[AUTH] Invalid password for ${username}`);
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
            sqlMessage: err.sqlMessage,
        });
        res.status(500).json({
            error: 'Login failed',
            details:
                process.env.NODE_ENV === 'development'
                    ? err.message
                    : undefined,
        });
    }
};
