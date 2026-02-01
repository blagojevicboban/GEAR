import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');
const tempDir = path.join(__dirname, '../temp_backups');

// Ensure temp dir exists
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}


const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query(
        'SELECT role FROM users WHERE username = ?',
        [username]
    );
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
        rows.forEach((r) => (config[r.setting_key] = r.setting_value));
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
        if (role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });

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
    // Allow auth via header OR query param (essential for browser downloads)
    const requestor = req.headers['x-user-name'] || req.query.user_name;
    const { format } = req.query; // 'json', 'sql', or 'full'

    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin')
            return res.status(403).json({ error: 'Forbidden' });

        if (format === 'sql' || format === 'full') {
            // SQL-based backup
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const workDir = path.join(tempDir, `backup_${timestamp}`);
            const sqlFile = path.join(workDir, 'database.sql');
            
            if (!fs.existsSync(workDir)) fs.mkdirSync(workDir, { recursive: true });

            // 1. Dump Database
            const dbHost = process.env.DB_HOST || 'localhost';
            const dbUser = process.env.DB_USER || 'gear';
            const dbPass = process.env.DB_PASSWORD || 'Tsp-2024';
            const dbName = process.env.DB_NAME || 'gear';

            console.log('Starting DB Dump...');
            await new Promise((resolve, reject) => {
                const dump = spawn('mysqldump', [
                    `-h${dbHost}`,
                    `-u${dbUser}`,
                    `--password=${dbPass}`,
                    dbName,
                ]);

                const fileStream = fs.createWriteStream(sqlFile);
                dump.stdout.pipe(fileStream);

                dump.stderr.on('data', (data) => console.error(`mysqldump stderr: ${data}`));

                dump.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`mysqldump exited with code ${code}`));
                });
            });

            const token = req.query.token;
            if (token) {
                res.cookie('backup_download_started', token, {
                    path: '/',
                    maxAge: 1000 * 60 * 5 // 5 minutes
                });
            }

            if (format === 'full') {
                // Full System Backup (ZIP)
                const zipFile = path.join(tempDir, `gear_full_backup_${timestamp}.zip`);
                
                // 2. Zip database.sql
                console.log('Zipping SQL...');
                await new Promise((resolve, reject) => {
                    const zip = spawn('zip', ['-q', zipFile, 'database.sql'], { cwd: workDir });
                    zip.on('close', code => code === 0 ? resolve() : reject(new Error(`zip sql failed: ${code}`)));
                    zip.on('error', reject);
                });

                // 3. Add Uploads directory
                const uploadsParent = path.dirname(uploadsDir);
                const uploadsBase = path.basename(uploadsDir);
                
                console.log('Adding Uploads to Zip...');
                if (fs.existsSync(uploadsDir)) {
                    await new Promise((resolve, reject) => {
                        const zip = spawn('zip', ['-urq', zipFile, uploadsBase], { cwd: uploadsParent });
                        zip.on('close', code => code === 0 ? resolve() : reject(new Error(`zip uploads failed: ${code}`)));
                        zip.on('error', reject);
                    });
                }

                res.download(zipFile, `gear_full_backup_${timestamp}.zip`, (err) => {
                    if (err) console.error('Error sending file:', err);
                    try {
                        fs.rmSync(workDir, { recursive: true, force: true });
                        fs.unlinkSync(zipFile);
                    } catch (e) { console.error('Cleanup error:', e); }
                });
            } else {
                // SQL Only (Database)
                res.download(sqlFile, `gear_db_backup_${timestamp}.sql`, (err) => {
                    if (err) console.error('Error sending file:', err);
                    try {
                        fs.rmSync(workDir, { recursive: true, force: true });
                    } catch (e) { console.error('Cleanup error:', e); }
                });
            }

        } else {
            // Default JSON (Database Only)
             const tables = [
                'users', 'models', 'workshops', 'sectors', 'lessons', 'hotspots', 'system_settings'
            ];
            const backupData = {
                timestamp: new Date().toISOString(),
                tables: {},
            };

            for (const table of tables) {
                try {
                    const [rows] = await pool.query(`SELECT * FROM ${table}`);
                    backupData.tables[table] = rows;
                } catch (e) {
                    console.warn(`Skipping table ${table} in backup: ${e.message}`);
                }
            }

            const token = req.query.token;
            if (token) {
                res.cookie('backup_download_started', token, {
                    path: '/',
                    maxAge: 1000 * 60 * 5
                });
            }

            res.setHeader('Content-Disposition', `attachment; filename="gear_backup_${Date.now()}.json"`);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(backupData, null, 2));
        }
    } catch (err) {
        console.error('Backup error:', err);
        res.status(500).json({ error: 'Backup failed: ' + err.message });
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
        
        if (ext === '.zip' || ext === '.sql') {
             // SQL-based Restore (Full ZIP or SQL file)
             const dbHost = process.env.DB_HOST || 'localhost';
             const dbUser = process.env.DB_USER || 'gear';
             const dbPass = process.env.DB_PASSWORD || 'Tsp-2024';
             const dbName = process.env.DB_NAME || 'gear';

             if (ext === '.zip') {
                // Full System Restore
                const zipPath = req.file.path;
                const extractPath = path.join(tempDir, `restore_${Date.now()}`);
                if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });

                try {
                    await execAsync(`unzip -q "${zipPath}" -d "${extractPath}"`);
                    const sqlFile = path.join(extractPath, 'database.sql');
                    if (fs.existsSync(sqlFile)) {
                        await new Promise((resolve, reject) => {
                            const restore = spawn('mysql', [`-h${dbHost}`, `-u${dbUser}`, `--password=${dbPass}`, dbName]);
                            fs.createReadStream(sqlFile).pipe(restore.stdin);
                            restore.on('close', code => code === 0 ? resolve() : reject(new Error(`mysql exited with ${code}`)));
                            restore.stderr.on('data', d => console.error('mysql err:', d.toString()));
                        });
                    }
                    const uploadsInZip = path.join(extractPath, 'uploads');
                    if (fs.existsSync(uploadsInZip)) {
                        const fallbackPath = path.join(path.dirname(uploadsDir), `uploads_backup_${Date.now()}`);
                        if (fs.existsSync(uploadsDir)) fs.renameSync(uploadsDir, fallbackPath);
                        fs.renameSync(uploadsInZip, uploadsDir);
                    }
                    res.json({ success: true, message: 'Full system restore completed.' });
                } finally {
                    if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
                }
             } else {
                // SQL Only Restore
                await new Promise((resolve, reject) => {
                    const restore = spawn('mysql', [`-h${dbHost}`, `-u${dbUser}`, `--password=${dbPass}`, dbName]);
                    fs.createReadStream(req.file.path).pipe(restore.stdin);
                    restore.on('close', (code) => code === 0 ? resolve() : reject(new Error(`mysql exited with ${code}`)));
                    restore.stderr.on('data', d => console.error('mysql err:', d.toString()));
                });
                res.json({ success: true, message: 'Database restored successfully from SQL.' });
             }

        } else if (ext === '.json') {
            const jsonContent = fs.readFileSync(req.file.path, 'utf8');
            const data = JSON.parse(jsonContent);

            try {
                const tables = Object.keys(data.tables || {});
                for (const table of tables) {
                    const rows = data.tables[table];
                    if (rows.length > 0) {
                        const columns = Object.keys(rows[0])
                            .map((c) => `\`${c}\``)
                            .join(', ');
                        const values = rows
                            .map((row) => {
                                return (
                                    '(' +
                                    Object.values(row)
                                        .map((val) => pool.escape(val))
                                        .join(', ') +
                                    ')'
                                );
                            })
                            .join(', ');
                        await pool.query(
                            `REPLACE INTO \`${table}\` (${columns}) VALUES ${values}`
                        );
                    }
                }
                res.json({
                    success: true,
                    message: 'Database restored successfully (JSON Upsert).',
                });
            } catch (jsonErr) {
                console.error('JSON Restore Error:', jsonErr);
                res.status(500).json({
                    error: 'JSON Import Failed: ' + jsonErr.message,
                });
            }
        } else {
            res.status(400).json({
                error: 'Unsupported file format. Use .zip (Full) or .json (Data)',
            });
        }

        if (req.file && fs.existsSync(req.file.path))
            fs.unlinkSync(req.file.path);
    } catch (err) {
        console.error(err);
        if (req.file && fs.existsSync(req.file.path))
            fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Restore failed: ' + err.message });
    }
};
