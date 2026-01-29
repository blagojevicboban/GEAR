import pool from '../db.js';

const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query(
        'SELECT role FROM users WHERE username = ?',
        [username]
    );
    return users.length > 0 ? users[0].role : null;
};

export const getAllSectors = async (req, res) => {
    try {
        const [sectors] = await pool.query(
            'SELECT DISTINCT name FROM sectors ORDER BY name ASC'
        );
        // Return simple array of strings: ['Chemistry', 'Construction', ...]
        res.json(sectors.map((s) => s.name));
    } catch (err) {
        console.error('Failed to fetch sectors:', err);
        res.status(500).json({ error: 'Failed to fetch sectors' });
    }
};

export const createSector = async (req, res) => {
    const { name } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!name) return res.status(400).json({ error: 'Name required' });

        // Check if exists
        const [exists] = await pool.query(
            'SELECT * FROM sectors WHERE name = ?',
            [name]
        );
        if (exists.length > 0) {
            return res.status(400).json({ error: 'Sector already exists' });
        }

        await pool.query(
            'INSERT INTO sectors (id, name, description) VALUES (?, ?, ?)',
            [name, name, 'Manual Entry']
        );
        res.json({ success: true, name });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create sector' });
    }
};

export const deleteSector = async (req, res) => {
    const { name } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        // Check if in use
        const [models] = await pool.query(
            'SELECT id FROM models WHERE sector = ?',
            [name]
        );
        if (models.length > 0) {
            return res
                .status(400)
                .json({ error: 'Sector is in use by models. Cannot delete.' });
        }

        await pool.query('DELETE FROM sectors WHERE name = ?', [name]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete sector' });
    }
};

export const renameSector = async (req, res) => {
    const { name } = req.params; // Old name
    const { newName } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!newName)
            return res.status(400).json({ error: 'New name required' });

        // 1. Create new sector if not exists
        const [exists] = await pool.query(
            'SELECT * FROM sectors WHERE id = ?',
            [newName]
        );
        if (exists.length === 0) {
            await pool.query(
                'INSERT INTO sectors (id, name, description) VALUES (?, ?, ?)',
                [newName, newName, 'Renamed Sector']
            );
        }

        // 2. Migrate all models
        await pool.query('UPDATE models SET sector = ? WHERE sector = ?', [
            newName,
            name,
        ]);

        // 3. Delete old sector
        await pool.query('DELETE FROM sectors WHERE id = ?', [name]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to rename sector' });
    }
};
