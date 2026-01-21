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
        const [models] = await pool.query('SELECT * FROM models');
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
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// Add new model
app.post('/api/models', async (req, res) => {
    const model = req.body;
    // Check if modelUrl is a relative path (from upload) or absolute. 
    // If it's a blob url, we can't save it effectively for persistence, but for now we trust the frontend sends a valid URL.

    try {
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

    // We need to handle transaction ideally, but for now simple sequential queries
    try {
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
// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Delete model
app.delete('/api/models/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);
        await pool.query('DELETE FROM models WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete model' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
