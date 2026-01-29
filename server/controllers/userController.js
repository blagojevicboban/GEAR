import pool from '../db.js';
import bcrypt from 'bcryptjs';

const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query('SELECT role FROM users WHERE username = ?', [username]);
    return users.length > 0 ? users[0].role : null;
};

export const getPublicProfile = async (req, res) => {
    const { username } = req.params;
    try {
        const [users] = await pool.query(
            'SELECT username, role, institution, bio, profilePicUrl, email FROM users WHERE username = ?',
            [username]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

export const getAllUsers = async (req, res) => {
    const requestor = req.headers['x-user-name'];
    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
        const [users] = await pool.query('SELECT id, username, email, institution, role, profilePicUrl, createdAt FROM users');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

export const createUser = async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        const id = 'user-' + Date.now();
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, hashedPassword, role || 'student']
        );
        res.json({ id, username, email, institution, role });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};

export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { role, institution } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        await pool.query(
            'UPDATE users SET role = ?, institution = ? WHERE id = ?',
            [role, institution, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
};

export const updateProfile = async (req, res) => {
    const { id } = req.params;
    const { username, institution, bio, profilePicUrl } = req.body;

    try {
        await pool.query(
            'UPDATE users SET username=?, institution=?, bio=?, profilePicUrl=? WHERE id=?',
            [username, institution, bio, profilePicUrl, id]
        );
        res.json({ id, username, institution, bio, profilePicUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        if (requestor === id) {
            const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [requestor]);
            if (users.length > 0 && users[0].id === id) {
                return res.status(400).json({ error: 'Cannot delete yourself' });
            }
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
