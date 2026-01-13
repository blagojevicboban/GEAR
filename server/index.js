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

app.use(cors());
app.use(bodyParser.json());

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
    const { username, email, institution, password } = req.body;
    try {
        const id = 'user-' + Date.now();
        await pool.query(
            'INSERT INTO users (id, username, email, institution, password) VALUES (?, ?, ?, ?, ?)',
            [id, username, email, institution, password]
        );
        res.json({ id, username, email, institution });
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

// Add new model
app.post('/api/models', async (req, res) => {
    const model = req.body;
    try {
        await pool.query(
            'INSERT INTO models (id, name, description, sector, equipmentType, level, modelUrl, thumbnailUrl, optimized, fileSize, uploadedBy, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [model.id, model.name, model.description, model.sector, model.equipmentType, model.level, model.modelUrl, model.thumbnailUrl, model.optimized, model.fileSize, model.uploadedBy, model.createdAt]
        );
        res.json(model);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add model' });
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
