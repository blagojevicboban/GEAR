import pool from '../db.js';
import * as fileService from '../services/fileService.js';
import bcrypt from 'bcryptjs';

const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query(
        'SELECT role FROM users WHERE username = ?',
        [username]
    );
    return users.length > 0 ? users[0].role : null;
};

export const getPublicProfile = async (req, res) => {
    const { username } = req.params;
    try {
        const [users] = await pool.query(
            'SELECT username, role, institution, bio, profilePicUrl, email, language FROM users WHERE username = ?',
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
            return res
                .status(403)
                .json({ error: 'Forbidden: Admin access only' });
        }
        const [users] = await pool.query(
            'SELECT id, username, email, institution, role, profilePicUrl, language, createdAt FROM users'
        );
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
            return res
                .status(403)
                .json({ error: 'Forbidden: Admin access only' });
        }

        const id = 'user-' + Date.now();
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [
                id,
                username,
                email,
                institution,
                hashedPassword,
                role || 'student',
            ]
        );
        res.json({ id, username, email, institution, role });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res
                .status(400)
                .json({ error: 'Username or email already exists' });
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
            return res
                .status(403)
                .json({ error: 'Forbidden: Admin access only' });
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
        let finalProfilePicUrl = profilePicUrl;
        
        // Consolidate profile picture
        if (profilePicUrl && profilePicUrl.startsWith('/api/uploads/')) {
            const profilesDir = '/api/uploads/profile_pictures/';
            if (!profilePicUrl.startsWith(profilesDir)) {
                 finalProfilePicUrl = fileService.moveFileToFolder(profilePicUrl, profilesDir);
            }
        }

        await pool.query(
            'UPDATE users SET username=?, institution=?, bio=?, profilePicUrl=?, language=? WHERE id=?',
            [username, institution, bio, finalProfilePicUrl, req.body.language, id]
        );
        res.json({ id, username, institution, bio, profilePicUrl: finalProfilePicUrl, language: req.body.language });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

export const changePassword = async (req, res) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    try {
        // 1. Get user by ID (need password hash)
        const [users] = await pool.query(
            'SELECT password FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // 2. Verify current password
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // 3. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 4. Update password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [
            hashedPassword,
            id,
        ]);

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update password' });
    }
};

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res
                .status(403)
                .json({ error: 'Forbidden: Admin access only' });
        }

        if (requestor === id) {
            const [users] = await pool.query(
                'SELECT id FROM users WHERE username = ?',
                [requestor]
            );
            if (users.length > 0 && users[0].id === id) {
                return res
                    .status(400)
                    .json({ error: 'Cannot delete yourself' });
            }
        }

        // Delete Profile Picture
        const [userRows] = await pool.query('SELECT profilePicUrl FROM users WHERE id = ?', [id]);
        if (userRows.length > 0 && userRows[0].profilePicUrl) {
            const picUrl = userRows[0].profilePicUrl;
            if (picUrl.startsWith('/api/uploads/')) {
                // fileService will detect 'profile_pictures' folder and ONLY delete the file, protecting the folder
                fileService.deleteFile(picUrl.replace('/api/uploads/', ''));
            }
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
};
