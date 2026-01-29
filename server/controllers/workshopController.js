import pool from '../db.js';

export const createWorkshop = async (req, res) => {
    const { modelId, createdBy } = req.body;
    const id = 'ws-' + Date.now();
    try {
        await pool.query(
            'INSERT INTO workshops (id, modelId, createdBy) VALUES (?, ?, ?)',
            [id, modelId, createdBy]
        );
        res.json({ id, modelId, createdBy });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create workshop' });
    }
};

export const getActiveWorkshops = async (req, res) => {
    try {
        const [workshops] = await pool.query(`
            SELECT w.*, m.name as modelName, u.username as creatorName 
            FROM workshops w
            JOIN models m ON w.modelId = m.id
            JOIN users u ON w.createdBy = u.username
            WHERE w.status = 'active'
        `);
        res.json(workshops);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch workshops' });
    }
};
