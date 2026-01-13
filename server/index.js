const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Example: Get all items (adjust table name as needed)
app.get('/api/items', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items'); // Replace 'items' with actual table
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
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
