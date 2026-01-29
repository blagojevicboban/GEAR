import pool from '../db.js';
import * as aiService from '../services/aiService.js';
import * as fileService from '../services/fileService.js';
import path from 'path'; // Needed for logging? No, fileService handles file ops.

const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query(
        'SELECT role FROM users WHERE username = ?',
        [username]
    );
    return users.length > 0 ? users[0].role : null;
};

export const getModels = async (req, res) => {
    try {
        const [models] = await pool.query(`
            SELECT m.*, u.profilePicUrl as uploaderProfilePic 
            FROM models m 
            LEFT JOIN users u ON m.uploadedBy = u.username
        `);
        const [hotspots] = await pool.query('SELECT * FROM hotspots');

        const modelsWithHotspots = models.map((model) => ({
            ...model,
            optimized: !!model.optimized,
            hotspots: hotspots
                .filter((h) => h.model_id === model.id)
                .map((h) => ({
                    ...h,
                    position:
                        typeof h.position === 'string'
                            ? JSON.parse(h.position)
                            : h.position,
                })),
        }));

        res.json(modelsWithHotspots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

export const createModel = async (req, res) => {
    const model = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (!role) {
            return res
                .status(401)
                .json({ error: 'Unauthorized: Unknown user' });
        }

        if (role !== 'admin') {
            model.uploadedBy = requestor;
        } else {
            model.uploadedBy = model.uploadedBy || requestor;
        }

        if (model.sector) {
            const [sectors] = await pool.query(
                'SELECT id FROM sectors WHERE id = ?',
                [model.sector]
            );
            if (sectors.length === 0) {
                console.log(`Auto-creating new sector: ${model.sector}`);
                await pool.query(
                    'INSERT INTO sectors (id, name, description) VALUES (?, ?, ?)',
                    [model.sector, model.sector, 'Custom User Sector']
                );
            }
        }

        await pool.query(
            'INSERT INTO models (id, name, description, sector, equipmentType, level, modelUrl, thumbnailUrl, optimized, fileSize, uploadedBy, createdAt, isFeatured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                model.id,
                model.name,
                model.description,
                model.sector,
                model.equipmentType,
                model.level,
                model.modelUrl,
                model.thumbnailUrl,
                model.optimized,
                model.fileSize,
                model.uploadedBy,
                model.createdAt,
                model.isFeatured || false,
            ]
        );
        res.json(model);
    } catch (err) {
        console.error('Model Upload Error:', err);
        res.status(500).json({ error: 'Failed to add model: ' + err.message });
    }
};

export const updateModel = async (req, res) => {
    const { id } = req.params;
    const model = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (role !== 'admin') {
            const [existing] = await pool.query(
                'SELECT uploadedBy FROM models WHERE id = ?',
                [id]
            );
            if (existing.length === 0)
                return res.status(404).json({ error: 'Model not found' });

            if (existing[0].uploadedBy !== requestor) {
                return res.status(403).json({
                    error: 'Forbidden: You can only edit your own models',
                });
            }
            model.uploadedBy = requestor;
        }

        await pool.query(
            'UPDATE models SET name=?, description=?, sector=?, equipmentType=?, level=?, modelUrl=?, thumbnailUrl=?, uploadedBy=?, isFeatured=? WHERE id=?',
            [
                model.name,
                model.description,
                model.sector,
                model.equipmentType,
                model.level,
                model.modelUrl,
                model.thumbnailUrl,
                model.uploadedBy,
                model.isFeatured || false,
                id,
            ]
        );

        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);

        if (model.hotspots && model.hotspots.length > 0) {
            const hotspotValues = model.hotspots.map((h) => [
                h.id,
                id,
                JSON.stringify(h.position),
                h.title,
                h.description,
                h.mediaUrl || null,
                h.type,
            ]);

            await pool.query(
                'INSERT INTO hotspots (id, model_id, position, title, description, mediaUrl, type) VALUES ?',
                [hotspotValues]
            );
        }

        res.json(model);
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: 'Failed to update model' });
    }
};

export const deleteModel = async (req, res) => {
    try {
        const { id } = req.params;
        const requestor = req.headers['x-user-name'];

        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (role !== 'admin') {
            const [existing] = await pool.query(
                'SELECT uploadedBy FROM models WHERE id = ?',
                [id]
            );
            if (existing.length === 0)
                return res.status(404).json({ error: 'Model not found' });

            if (existing[0].uploadedBy !== requestor) {
                return res.status(403).json({
                    error: 'Forbidden: You can only delete your own models',
                });
            }
        }

        const [rows] = await pool.query(
            'SELECT modelUrl FROM models WHERE id = ?',
            [id]
        );
        if (rows.length > 0) {
            const fileUrl = rows[0].modelUrl;
            if (fileUrl && fileUrl.startsWith('/api/uploads/')) {
                fileService.deleteFile(fileUrl.replace('/api/uploads/', ''));
            }
        }

        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);
        await pool.query('DELETE FROM models WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete model' });
    }
};

export const optimize = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await aiService.optimizeModel(id);
        res.json({ success: true, ...result });
    } catch (err) {
        console.error(err);
        if (err.message === 'Model not found')
            return res.status(404).json({ error: err.message });
        res.status(500).json({ error: err.message });
    }
};

export const generateLesson = async (req, res) => {
    try {
        const steps = await aiService.generateLesson(req.body);
        res.json({ steps });
    } catch (err) {
        console.error('AI Lesson Gen Error:', err);
        res.status(500).json({
            error: 'Failed to generate lesson: ' + err.message,
        });
    }
};
