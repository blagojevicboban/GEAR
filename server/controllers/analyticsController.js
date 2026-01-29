import pool from '../db.js';

export const logAnalytics = async (req, res) => {
    const { logs } = req.body; // Array of { userId, lessonId, modelId, position, target, duration }
    if (!logs || !Array.isArray(logs))
        return res.status(400).json({ error: 'Invalid payload' });

    try {
        const values = logs.map((l) => [
            l.userId || 'anonymous',
            l.lessonId,
            l.modelId,
            JSON.stringify(l.position),
            JSON.stringify(l.target),
            l.duration || 0,
        ]);

        if (values.length > 0) {
            await pool.query(
                'INSERT INTO analytics_logs (user_id, lesson_id, model_id, position, target, duration) VALUES ?',
                [values]
            );
        }
        res.json({ success: true, count: values.length });
    } catch (err) {
        console.error('Analytics Log Error:', err);
        res.status(500).json({ error: 'Failed to log analytics' });
    }
};

export const getHeatmap = async (req, res) => {
    const { modelId } = req.params;
    try {
        // Fetch raw points. In a real app, we might cluster this on the server.
        const [rows] = await pool.query(
            'SELECT target, duration FROM analytics_logs WHERE model_id = ? LIMIT 2000',
            [modelId]
        );

        const points = rows.map((r) => {
            const t =
                typeof r.target === 'string' ? JSON.parse(r.target) : r.target;
            return { ...t, weight: r.duration }; // {x, y, z, weight}
        });

        res.json(points);
    } catch (err) {
        console.error('Heatmap Fetch Error:', err);
        res.status(500).json({ error: 'Failed to fetch heatmap' });
    }
};
