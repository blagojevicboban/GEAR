import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

import fs from 'fs';
import multer from 'multer';

app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadDir));

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Sanitize filename to avoid issues
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
});

const upload = multer({ storage: storage });

// Serve uploads (Dual-route for Nginx proxy compatibility)
app.use('/uploads', express.static(uploadDir));
app.use('/api/uploads', express.static(uploadDir));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Get all models with their hotspots
app.get('/api/models', async (req, res) => {
    try {
        const [models] = await pool.query(`
            SELECT m.*, u.profilePicUrl as uploaderProfilePic 
            FROM models m 
            LEFT JOIN users u ON m.uploadedBy = u.username
        `);
        const [hotspots] = await pool.query('SELECT * FROM hotspots');

        const modelsWithHotspots = models.map(model => ({
            ...model,
            optimized: !!model.optimized,
            hotspots: hotspots.filter(h => h.model_id === model.id).map(h => ({
                ...h,
                position: typeof h.position === 'string' ? JSON.parse(h.position) : h.position
            }))
        }));

        res.json(modelsWithHotspots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Register new user
app.post('/api/register', async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    try {
        const id = 'user-' + Date.now();
        // Prevent users from registering as admin directly
        const userRole = (role === 'admin') ? 'student' : (role || 'student');

        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, password, userRole]
        );
        res.json({ id, username, email, institution, role: userRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (Simple mock logic for now, in prod use bcrypt)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body; // username here is email from frontend login form
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [username, password]);
        if (users.length > 0) {
            const { password: _, ...user } = users[0];
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Create new user (Admin only)
app.post('/api/users', async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        const id = 'user-' + Date.now();
        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, password, role || 'student']
        );
        res.json({ id, username, email, institution, role });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get public user profile
app.get('/api/users/public/:username', async (req, res) => {
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
});

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
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
});

// Update user (Admin only)
app.put('/api/users/:id', async (req, res) => {
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
});

// Update own profile
app.put('/api/users/:id/profile', async (req, res) => {
    const { id } = req.params;
    const { username, institution, bio, profilePicUrl } = req.body;

    // In a real app we should check session/token here. 
    // For now we assume the ID in url matches the logged in user or we blindly update based on ID.
    // Ideally pass 'X-User-Name' and verify.

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
});

// Delete user (Admin only)
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        // Optional: Prevent deleting self
        if (requestor === id) { // This might need ID lookup if requestor is username
            // For simplicity, let's look up requestor ID first to be safe, or just check username
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
});

// File Upload Endpoint
app.post('/api/upload', (req, res, next) => {
    console.log('Incoming upload request');
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: err.message });
        }
        next();
    });
}, (req, res) => {
    if (!req.file) {
        console.error('No file property in request after multer');
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File successfully saved:', req.file.filename);
    // Use /api/uploads so it goes through the Vite proxy (if dev) or Nginx proxy locations
    const fileUrl = `/api/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Helper to get user role
const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query('SELECT role FROM users WHERE username = ?', [username]);
    return users.length > 0 ? users[0].role : null;
};

// Add new model
app.post('/api/models', async (req, res) => {
    const model = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized: Unknown user' });
        }

        // Enforce ownership for non-admins
        if (role !== 'admin') {
            model.uploadedBy = requestor;
        } else {
            // Admin can set uploadedBy, or default to themselves
            model.uploadedBy = model.uploadedBy || requestor;
        }

        await pool.query(
            'INSERT INTO models (id, name, description, sector, equipmentType, level, modelUrl, thumbnailUrl, optimized, fileSize, uploadedBy, createdAt, isFeatured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [model.id, model.name, model.description, model.sector, model.equipmentType, model.level, model.modelUrl, model.thumbnailUrl, model.optimized, model.fileSize, model.uploadedBy, model.createdAt, model.isFeatured || false]
        );
        res.json(model);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add model' });
    }
});
// Update model
app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const model = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check ownership if not admin
        if (role !== 'admin') {
            const [existing] = await pool.query('SELECT uploadedBy FROM models WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ error: 'Model not found' });

            if (existing[0].uploadedBy !== requestor) {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own models' });
            }
            // Ensure student/teacher cannot change uploadedBy to someone else
            model.uploadedBy = requestor;
        }

        // Update model fields
        await pool.query(
            'UPDATE models SET name=?, description=?, sector=?, equipmentType=?, level=?, modelUrl=?, thumbnailUrl=?, uploadedBy=?, isFeatured=? WHERE id=?',
            [model.name, model.description, model.sector, model.equipmentType, model.level, model.modelUrl, model.thumbnailUrl, model.uploadedBy, model.isFeatured || false, id]
        );

        // Update Hotspots: Strategy -> Delete all and re-insert
        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);

        if (model.hotspots && model.hotspots.length > 0) {
            const hotspotValues = model.hotspots.map(h => [
                h.id,
                id,
                JSON.stringify(h.position),
                h.title,
                h.description,
                h.mediaUrl || null,
                h.type
            ]);

            // Bulk insert
            await pool.query(
                'INSERT INTO hotspots (id, model_id, position, title, description, mediaUrl, type) VALUES ?',
                [hotspotValues]
            );
        }

        res.json(model);
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: 'Failed to update model' });
    }
});
// Delete model
app.delete('/api/models/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const requestor = req.headers['x-user-name'];

        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (role !== 'admin') {
            const [existing] = await pool.query('SELECT uploadedBy FROM models WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ error: 'Model not found' });

            if (existing[0].uploadedBy !== requestor) {
                return res.status(403).json({ error: 'Forbidden: You can only delete your own models' });
            }
        }

        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);
        await pool.query('DELETE FROM models WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete model' });
    }
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
