import pool from '../db.js';

export const getVideos = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM academy_videos ORDER BY created_at DESC');

        // Group by category to match previous JSON structure
        const grouped = rows.reduce((acc, video) => {
            if (!acc[video.category]) acc[video.category] = [];
            acc[video.category].push({
                id: video.id,
                title: video.title,
                duration: video.duration,
                url: video.url,
                desc: video.description, // Mapping DB 'description' to frontend expected 'desc' if needed, or keeping both? Check usage. 
                // Previous file used 'desc'. DB has 'description'. Let's alias it to be safe.
                // Actually, let's look at the original code: "desc: '...'"
            });
            return acc;
        }, {});

        // Ensure keys exist even if empty, matching defaults if possible, or just return what we have.
        // The original code had specific keys: basics, creation, pedagogy. 
        // If they are empty in DB, they won't appear here. This might break frontend if it expects them.
        // Let's ensure default keys exist.
        const structure = {
            basics: grouped.basics || [],
            creation: grouped.creation || [],
            pedagogy: grouped.pedagogy || [],
            ...grouped // Include any others that might be added dynamically
        };

        res.json(structure);
    } catch (e) {
        console.error("Failed to fetch videos:", e);
        res.status(500).json({ error: "Failed to fetch videos" });
    }
};

export const addVideo = async (req, res) => {
    const requestor = req.headers['x-user-name'];
    if (!requestor) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { category, video } = req.body;
        // Video object likely comes as { title, duration, url, desc }
        // We need to map 'desc' to 'description' if that's what comes in.

        const description = video.desc || video.description || '';

        const [result] = await pool.query(
            'INSERT INTO academy_videos (category, title, duration, url, description) VALUES (?, ?, ?, ?, ?)',
            [category, video.title, video.duration, video.url, description]
        );

        const newVideo = {
            id: result.insertId,
            ...video,
            desc: description
        };

        res.json(newVideo);
    } catch (e) {
        console.error("Failed to save video:", e);
        res.status(500).json({ error: "Failed to save video" });
    }
};

export const deleteVideo = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const [result] = await pool.query('DELETE FROM academy_videos WHERE id = ?', [id]);
        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Video not found" });
        }
    } catch (e) {
        console.error("Failed to delete video:", e);
        res.status(500).json({ error: "Failed to delete video" });
    }
};

export const updateVideo = async (req, res) => {
    const id = parseInt(req.params.id);
    const { video } = req.body;
    try {
        // Construct dynamic update query
        // Incoming video object might have partial fields? 
        // Original logic was: data[cat][idx] = { ...data[cat][idx], ...video };

        // We need to fetch existing to know what to update? Or just update what is passed.
        // DB update requires explicit fields.
        // Let's assume video contains all fields or we build a query.

        const fields = [];
        const values = [];

        if (video.title) { fields.push('title = ?'); values.push(video.title); }
        if (video.duration) { fields.push('duration = ?'); values.push(video.duration); }
        if (video.url) { fields.push('url = ?'); values.push(video.url); }
        if (video.desc || video.description) {
            fields.push('description = ?');
            values.push(video.desc || video.description);
        }
        if (video.category) { fields.push('category = ?'); values.push(video.category); }
        // Note: category change might be tricky if frontend logic relies on simple ID lookup within category but API structure suggests ID is global. 

        if (fields.length === 0) return res.json({ success: true }); // Nothing to update

        values.push(id);

        const [result] = await pool.query(`UPDATE academy_videos SET ${fields.join(', ')} WHERE id = ?`, values);

        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: "Video not found" });
        }
    } catch (e) {
        console.error("Failed to update video:", e);
        res.status(500).json({ error: "Failed to update video" });
    }
};
