import pool from '../db.js';

export const saveScore = async (req, res) => {
    try {
        const { userId, username, modelId, timeSeconds } = req.body;
        
        if (!userId || !modelId || !timeSeconds) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const query = 'INSERT INTO scores (user_id, username, model_id, time_seconds) VALUES (?, ?, ?, ?)';
        const [result] = await pool.query(query, [userId, username, modelId, timeSeconds]);

        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error saving score:', error);
        res.status(500).json({ error: 'Failed to save score' });
    }
};

export const getScores = async (req, res) => {
    try {
        const { modelId } = req.params;
        
        // Get top 10 fastest times
        const query = 'SELECT * FROM scores WHERE model_id = ? ORDER BY time_seconds ASC LIMIT 10';
        const [rows] = await pool.query(query, [modelId]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching scores:', error);
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
};
