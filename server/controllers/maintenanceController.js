import fs from 'fs';
import path from 'path';
import pool from '../db.js';
import { uploadDir } from '../services/fileService.js';

// Helper to get size
const getFileSize = (filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return stats.size;
    } catch (e) {
        return 0;
    }
};

// Helper to get directory size (recursive)
const getDirSize = (dirPath) => {
    let size = 0;
    try {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getDirSize(filePath);
            } else {
                size += stats.size;
            }
        }
    } catch (e) {
        return 0;
    }
    return size;
};

export const getOrphans = async (req, res) => {
    try {
        // 1. Gather all referenced paths from DB
        const references = new Set();
        
        // Whitelist specific folders
        references.add('profile_pictures'); // Always keep, or rely on usage
        
        // Models
        const [models] = await pool.query('SELECT modelUrl, thumbnailUrl FROM models');
        models.forEach(m => {
            if (m.modelUrl) references.add(m.modelUrl);
            if (m.thumbnailUrl) references.add(m.thumbnailUrl);
        });

        // Lessons
        const [lessons] = await pool.query('SELECT image_url FROM lessons');
        lessons.forEach(l => {
            if (l.image_url) references.add(l.image_url);
        });

        // Lesson Steps
        const [steps] = await pool.query('SELECT image_url, content FROM lesson_steps');
        steps.forEach(s => {
            if (s.image_url) references.add(s.image_url);
            if (s.content) {
                const regex = /src="(\/api\/uploads\/[^"]+)"/g;
                let match;
                while ((match = regex.exec(s.content)) !== null) {
                    references.add(match[1]);
                }
            }
        });

        // Users
        const [users] = await pool.query('SELECT profilePicUrl FROM users');
        users.forEach(u => {
            if (u.profilePicUrl) references.add(u.profilePicUrl);
        });

        // 2. Normalize references to top-level names in uploads
        // Set contains: '/api/uploads/folder/file.png' or '/api/uploads/file.png'
        const keptItems = new Set();
        keptItems.add('profile_pictures'); // Explicit keep

        references.forEach(ref => {
            if (typeof ref === 'string' && ref.startsWith('/api/uploads/')) {
                const relative = ref.replace('/api/uploads/', '');
                const parts = relative.split('/'); // ['folder', 'file'] or ['file']
                const topLevel = parts[0];
                // Handle hash/params if any (though usually clean path)
                const cleanTop = topLevel.split('#')[0].split('?')[0];
                keptItems.add(decodeURIComponent(cleanTop));
            }
        });

        // 3. Scan Uploads Directory
        const orphans = [];
        const items = fs.readdirSync(uploadDir);

        for (const item of items) {
             if (keptItems.has(item)) continue;
             
             // Check if it's a hidden file or system file (optional)
             if (item.startsWith('.')) continue;

             const fullPath = path.join(uploadDir, item);
             const stats = fs.statSync(fullPath);
             const isDir = stats.isDirectory();
             
             orphans.push({
                 name: item,
                 path: item, // relative to uploads
                 type: isDir ? 'folder' : 'file',
                 size: isDir ? getDirSize(fullPath) : stats.size,
                 updatedAt: stats.mtime
             });
        }

        res.json(orphans);

    } catch (err) {
        console.error('Failed to scan for orphans:', err);
        res.status(500).json({ error: 'Failed to scan for orphans' });
    }
};

export const deleteOrphan = async (req, res) => {
    const { name } = req.params; // Expecting top-level name
    // Validate to prevent traversal
    if (!name || name.includes('..') || name.includes('/')) {
        return res.status(400).json({ error: 'Invalid name' });
    }

    try {
        const fullPath = path.join(uploadDir, name);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
            fs.unlinkSync(fullPath);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete orphan:', err);
        res.status(500).json({ error: 'Failed to delete orphan' });
    }
};

export const deleteAllOrphans = async (req, res) => {
    try {
        // Reuse getOrphans logic (duplicated for safety to strictly control what is deleted atm)
        // 1. References
        const references = new Set();
        references.add('profile_pictures');

        const [models] = await pool.query('SELECT modelUrl, thumbnailUrl FROM models');
        models.forEach(m => { if (m.modelUrl) references.add(m.modelUrl); if (m.thumbnailUrl) references.add(m.thumbnailUrl); });

        const [lessons] = await pool.query('SELECT image_url FROM lessons');
        lessons.forEach(l => { if (l.image_url) references.add(l.image_url); });

        const [steps] = await pool.query('SELECT image_url, content FROM lesson_steps');
        steps.forEach(s => {
            if (s.image_url) references.add(s.image_url);
            if (s.content) {
                const regex = /src="(\/api\/uploads\/[^"]+)"/g;
                let match;
                while ((match = regex.exec(s.content)) !== null) references.add(match[1]);
            }
        });

        const [users] = await pool.query('SELECT profilePicUrl FROM users');
        users.forEach(u => { if (u.profilePicUrl) references.add(u.profilePicUrl); });

        const keptItems = new Set();
        keptItems.add('profile_pictures');
        references.forEach(ref => {
            if (typeof ref === 'string' && ref.startsWith('/api/uploads/')) {
                const cleanTop = decodeURIComponent(ref.replace('/api/uploads/', '').split('/')[0].split('#')[0].split('?')[0]);
                keptItems.add(cleanTop);
            }
        });

        // 2. Scan and Delete
        const items = fs.readdirSync(uploadDir);
        let deletedCount = 0;

        for (const item of items) {
             if (keptItems.has(item)) continue;
             if (item.startsWith('.')) continue;

             const fullPath = path.join(uploadDir, item);
             try {
                const stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                } else {
                    fs.unlinkSync(fullPath);
                }
                deletedCount++;
             } catch(e) {
                 console.error(`Failed to delete ${item}`, e);
             }
        }

        res.json({ success: true, count: deletedCount });

    } catch (err) {
        console.error('Failed to delete all orphans:', err);
        res.status(500).json({ error: 'Failed to delete orphans' });
    }
};
