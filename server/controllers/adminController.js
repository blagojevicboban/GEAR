import pool from '../db.js';
import fs from 'fs';
import path from 'path';

const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query('SELECT role FROM users WHERE username = ?', [username]);
    return users.length > 0 ? users[0].role : null;
};

export const getLogs = async (req, res) => {
    const requestor = req.headers['x-user-name'];
    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const logPath = path.join(process.cwd(), 'server_error.log');
        if (fs.existsSync(logPath)) {
            // Read last 100 lines
            const data = fs.readFileSync(logPath, 'utf8');
            const lines = data.split('\n');
            const last100 = lines.slice(-100).join('\n');
            res.send(last100);
        } else {
            res.send('No logs found.');
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read logs' });
    }
};

export const getConfig = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM system_settings');
        const config = {};
        rows.forEach(r => config[r.setting_key] = r.setting_value);
        res.json(config);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
};

export const updateConfig = async (req, res) => {
    const requestor = req.headers['x-user-name'];
    const settings = req.body; // { key: value, key2: value2 }

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        for (const [key, value] of Object.entries(settings)) {
            await pool.query(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, String(value), String(value)]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update config' });
    }
};

export const getBackup = async (req, res) => {
    const requestor = req.headers['x-user-name'];
    const { format } = req.query; // 'json' or 'sql'

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

        const tables = ['users', 'models', 'workshops', 'sectors', 'lessons', 'hotspots', 'system_settings'];

        if (format === 'sql') {
            let sqlDump = `-- GEAR Database Backup\n-- Generated: ${new Date().toISOString()}\n\n`;

            for (const table of tables) {
                try {
                    const [rows] = await pool.query(`SELECT * FROM ${table}`);
                    if (rows.length > 0) {
                        sqlDump += `\n-- Table: ${table}\n`;
                        sqlDump += `LOCK TABLES \`${table}\` WRITE;\n`;
                        sqlDump += `/*!40000 ALTER TABLE \`${table}\` DISABLE KEYS */;\n`;

                        const insertStatements = rows.map(row => {
                            const values = Object.values(row).map(val => {
                                if (val === null) return 'NULL';
                                if (typeof val === 'number') return val;
                                // Escape single quotes and backslashes
                                return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
                            }).join(', ');
                            return `INSERT INTO \`${table}\` VALUES (${values});`;
                        }).join('\n');

                        sqlDump += insertStatements + '\n';
                        sqlDump += `/*!40000 ALTER TABLE \`${table}\` ENABLE KEYS */;\n`;
                        sqlDump += `UNLOCK TABLES;\n`;
                    }
                } catch (e) {
                    console.warn(`Skipping table ${table} in backup: ${e.message}`);
                }
            }

            res.setHeader('Content-Disposition', `attachment; filename="gear_backup_${Date.now()}.sql"`);
            res.setHeader('Content-Type', 'application/sql');
            res.send(sqlDump);

        } else {
            // Default JSON
            const backupData = {
                timestamp: new Date().toISOString(),
                tables: {}
            };

            for (const table of tables) {
                try {
                    const [rows] = await pool.query(`SELECT * FROM ${table}`);
                    backupData.tables[table] = rows;
                } catch (e) {
                    console.warn(`Skipping table ${table} in backup: ${e.message}`);
                }
            }

            res.setHeader('Content-Disposition', `attachment; filename="gear_backup_${Date.now()}.json"`);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(backupData, null, 2));
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Backup failed' });
    }
};

export const restoreBackup = async (req, res) => {
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === '.sql') {
            const sqlContent = fs.readFileSync(req.file.path, 'utf8');
            try {
                await pool.query(sqlContent);
                res.json({ success: true, message: 'Database restored successfully (SQL).' });
            } catch (sqlErr) {
                console.error("SQL Restore Error:", sqlErr);
                res.status(500).json({ error: 'SQL Execution Failed: ' + sqlErr.message });
            }

        } else if (ext === '.json') {
            const jsonContent = fs.readFileSync(req.file.path, 'utf8');
            const data = JSON.parse(jsonContent);

            try {
                const tables = Object.keys(data.tables || {});
                for (const table of tables) {
                    const rows = data.tables[table];
                    if (rows.length > 0) {
                        const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
                        const values = rows.map(row => {
                            return '(' + Object.values(row).map(val => pool.escape(val)).join(', ') + ')';
                        }).join(', ');
                        await pool.query(`REPLACE INTO \`${table}\` (${columns}) VALUES ${values}`);
                    }
                }
                res.json({ success: true, message: 'Database restored successfully (JSON Upsert).' });
            } catch (jsonErr) {
                console.error("JSON Restore Error:", jsonErr);
                res.status(500).json({ error: 'JSON Import Failed: ' + jsonErr.message });
            }

        } else {
            res.status(400).json({ error: 'Unsupported file format. Use .sql or .json' });
        }

        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Restore failed' });
    }
};
