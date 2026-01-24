import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pool from './db.js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
const PORT = process.env.PORT || 3001;

import fs from 'fs';
import multer from 'multer';

app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadDir));

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Sanitize filename to avoid issues
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
});

const upload = multer({ storage: storage });

// Serve uploads (Dual-route for Nginx proxy compatibility)
app.use('/uploads', express.static(uploadDir));
app.use('/api/uploads', express.static(uploadDir));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Get all models with their hotspots
app.get('/api/models', async (req, res) => {
    try {
        const [models] = await pool.query(`
            SELECT m.*, u.profilePicUrl as uploaderProfilePic 
            FROM models m 
            LEFT JOIN users u ON m.uploadedBy = u.username
        `);
        const [hotspots] = await pool.query('SELECT * FROM hotspots');

        const modelsWithHotspots = models.map(model => ({
            ...model,
            optimized: !!model.optimized,
            hotspots: hotspots.filter(h => h.model_id === model.id).map(h => ({
                ...h,
                position: typeof h.position === 'string' ? JSON.parse(h.position) : h.position
            }))
        }));

        res.json(modelsWithHotspots);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Register new user
app.post('/api/register', async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    try {
        const id = 'user-' + Date.now();
        // Prevent users from registering as admin directly
        const userRole = (role === 'admin') ? 'student' : (role || 'student');

        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, password, userRole]
        );
        res.json({ id, username, email, institution, role: userRole });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login (Simple mock logic for now, in prod use bcrypt)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body; // username here is email from frontend login form
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ? AND password = ?', [username, password]);
        if (users.length > 0) {
            const { password: _, ...user } = users[0];
            res.json(user);
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Create new user (Admin only)
app.post('/api/users', async (req, res) => {
    const { username, email, institution, password, role } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        const id = 'user-' + Date.now();
        await pool.query(
            'INSERT INTO users (id, username, email, institution, password, role) VALUES (?, ?, ?, ?, ?, ?)',
            [id, username, email, institution, password, role || 'student']
        );
        res.json({ id, username, email, institution, role });
    } catch (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Get public user profile
app.get('/api/users/public/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const [users] = await pool.query(
            'SELECT username, role, institution, bio, profilePicUrl, email FROM users WHERE username = ?',
            [username]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(users[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
});

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
    const requestor = req.headers['x-user-name'];
    try {
        const role = await getUserRole(requestor);
        if (role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }
        const [users] = await pool.query('SELECT id, username, email, institution, role, profilePicUrl, createdAt FROM users');
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user (Admin only)
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { role, institution } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        await pool.query(
            'UPDATE users SET role = ?, institution = ? WHERE id = ?',
            [role, institution, id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Update own profile
app.put('/api/users/:id/profile', async (req, res) => {
    const { id } = req.params;
    const { username, institution, bio, profilePicUrl } = req.body;

    // In a real app we should check session/token here. 
    // For now we assume the ID in url matches the logged in user or we blindly update based on ID.
    // Ideally pass 'X-User-Name' and verify.

    try {
        await pool.query(
            'UPDATE users SET username=?, institution=?, bio=?, profilePicUrl=? WHERE id=?',
            [username, institution, bio, profilePicUrl, id]
        );
        res.json({ id, username, institution, bio, profilePicUrl });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Delete user (Admin only)
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const requestorRole = await getUserRole(requestor);
        if (requestorRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access only' });
        }

        // Optional: Prevent deleting self
        if (requestor === id) { // This might need ID lookup if requestor is username
            // For simplicity, let's look up requestor ID first to be safe, or just check username
            const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [requestor]);
            if (users.length > 0 && users[0].id === id) {
                return res.status(400).json({ error: 'Cannot delete yourself' });
            }
        }

        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// File Upload Endpoint
app.post('/api/upload', (req, res, next) => {
    console.log('Incoming upload request');
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: err.message });
        }
        next();
    });
}, async (req, res) => {
    if (!req.file) {
        console.error('No file property in request after multer');
        return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log('File successfully saved:', req.file.filename);

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Auto-extract ZIP files for CAD assemblies
    if (fileExt === '.zip') {
        try {
            const AdmZip = (await import('adm-zip')).default;
            const zip = new AdmZip(filePath);
            const extractDir = path.join(uploadDir, path.basename(req.file.filename, '.zip') + '_extracted');

            // Extract all
            zip.extractAllTo(extractDir, true);
            console.log(`Extracted ZIP to: ${extractDir}`);

            // Find the main assembly or meaningful CAD file
            // Strategy: Look for .STEP, .STP, .SLDASM, .IGS in the root or just pick the largest one?
            // Usually the main assembly is in the root or has a specific extension.

            // Let's recursively find potential candidates
            const getFiles = (dir) => {
                let results = [];
                const list = fs.readdirSync(dir);
                list.forEach((file) => {
                    const fullPath = path.join(dir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat && stat.isDirectory()) {
                        results = results.concat(getFiles(fullPath));
                    } else {
                        results.push(fullPath);
                    }
                });
                return results;
            };

            const allFiles = getFiles(extractDir);

            // Priority list for "Main" file
            const extensions = ['.step', '.stp', '.sldasm', '.catproduct', '.iam', '.asm'];

            const candidates = allFiles.filter(f => extensions.includes(path.extname(f).toLowerCase()));
            let mainFile;

            // Prefer root files
            const rootFiles = candidates.filter(f => path.dirname(f) === extractDir);
            if (rootFiles.length > 0) {
                mainFile = rootFiles.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
            } else if (candidates.length > 0) {
                mainFile = candidates.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
            }

            // If no assembly, look for parts
            if (!mainFile) {
                const parts = allFiles.filter(f => ['.sldprt', '.ipt', '.prt', '.catpart'].includes(path.extname(f).toLowerCase()));
                if (parts.length > 0) mainFile = parts[0];
            }

            if (mainFile) {
                // We found a candidate. Return THIS as the model URL.
                // However, we need to serve this directory properly.
                // The URL should be relative.
                const relativePath = path.relative(uploadDir, mainFile);
                const newFileUrl = `/api/uploads/${relativePath}`;

                console.log(`Found main assembly file: ${mainFile} -> ${newFileUrl}`);
                return res.json({ url: newFileUrl, originalName: req.file.originalname, isAssembly: true });
            }
        } catch (zipErr) {
            console.error("ZIP extraction failed:", zipErr);
            // Fallback to just returning the zip file itself if extraction fails
        }

        // Strategy:
        // 1. Unzip the file to a folder named after the file (without .zip)
        // 2. Look for the main assembly file (.STEP, .ASM, .IGS) inside.
        // 3. Return the URL to that main file?
        // OR simply return the ZIP URL and let the frontend handle it (complex for frontend).
        // OR return the ZIP URL and let backend serve unzipped assets on demand.

        // Let's keep it simple: Just upload the ZIP. The Frontend will need to deduce it's a zip 
        // and maybe we reject it if we don't implement unzipping yet.

        // Actually, the USER asked if it is POSSIBLE.
        // I will impl simply saving it first.
        // The frontend ModelUploadForm accepts .zip now?
    }

    // Use /api/uploads so it goes through the Vite proxy (if dev) or Nginx proxy locations
    const fileUrl = `/api/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, originalName: req.file.originalname });
});

// Helper to get user role
const getUserRole = async (username) => {
    if (!username) return null;
    const [users] = await pool.query('SELECT role FROM users WHERE username = ?', [username]);
    return users.length > 0 ? users[0].role : null;
};

// Add new model
app.post('/api/models', async (req, res) => {
    const model = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized: Unknown user' });
        }

        // Enforce ownership for non-admins
        if (role !== 'admin') {
            model.uploadedBy = requestor;
        } else {
            // Admin can set uploadedBy, or default to themselves
            model.uploadedBy = model.uploadedBy || requestor;
        }

        // Check if sector exists, if not create it (prevent FK error)
        if (model.sector) {
            const [sectors] = await pool.query('SELECT id FROM sectors WHERE id = ?', [model.sector]);
            if (sectors.length === 0) {
                console.log(`Auto-creating new sector: ${model.sector}`);
                await pool.query('INSERT INTO sectors (id, name, description) VALUES (?, ?, ?)',
                    [model.sector, model.sector, 'Custom User Sector']
                );
            }
        }

        await pool.query(
            'INSERT INTO models (id, name, description, sector, equipmentType, level, modelUrl, thumbnailUrl, optimized, fileSize, uploadedBy, createdAt, isFeatured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [model.id, model.name, model.description, model.sector, model.equipmentType, model.level, model.modelUrl, model.thumbnailUrl, model.optimized, model.fileSize, model.uploadedBy, model.createdAt, model.isFeatured || false]
        );
        res.json(model);
    } catch (err) {
        console.error("Model Upload Error:", err);

        // Log to file for debugging
        const fs = await import('fs');
        const path = await import('path');
        const logPath = path.join(process.cwd(), 'server_error.log');
        const logEntry = `[${new Date().toISOString()}] POST /api/models Error: ${err.message}\nStack: ${err.stack}\nPayload: ${JSON.stringify(model)}\n-----------------------------------\n`;
        fs.appendFile(logPath, logEntry, (e) => { if (e) console.error("Failed to write to error log", e) });

        res.status(500).json({ error: 'Failed to add model: ' + err.message });
    }
});
// Update model
app.put('/api/models/:id', async (req, res) => {
    const { id } = req.params;
    const model = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check ownership if not admin
        if (role !== 'admin') {
            const [existing] = await pool.query('SELECT uploadedBy FROM models WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ error: 'Model not found' });

            if (existing[0].uploadedBy !== requestor) {
                return res.status(403).json({ error: 'Forbidden: You can only edit your own models' });
            }
            // Ensure student/teacher cannot change uploadedBy to someone else
            model.uploadedBy = requestor;
        }

        // Update model fields
        await pool.query(
            'UPDATE models SET name=?, description=?, sector=?, equipmentType=?, level=?, modelUrl=?, thumbnailUrl=?, uploadedBy=?, isFeatured=? WHERE id=?',
            [model.name, model.description, model.sector, model.equipmentType, model.level, model.modelUrl, model.thumbnailUrl, model.uploadedBy, model.isFeatured || false, id]
        );

        // Update Hotspots: Strategy -> Delete all and re-insert
        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);

        if (model.hotspots && model.hotspots.length > 0) {
            const hotspotValues = model.hotspots.map(h => [
                h.id,
                id,
                JSON.stringify(h.position),
                h.title,
                h.description,
                h.mediaUrl || null,
                h.type
            ]);

            // Bulk insert
            await pool.query(
                'INSERT INTO hotspots (id, model_id, position, title, description, mediaUrl, type) VALUES ?',
                [hotspotValues]
            );
        }

        res.json(model);
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: 'Failed to update model' });
    }
});
// Delete model
app.delete('/api/models/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const requestor = req.headers['x-user-name'];

        const role = await getUserRole(requestor);
        if (!role) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (role !== 'admin') {
            const [existing] = await pool.query('SELECT uploadedBy FROM models WHERE id = ?', [id]);
            if (existing.length === 0) return res.status(404).json({ error: 'Model not found' });

            if (existing[0].uploadedBy !== requestor) {
                return res.status(403).json({ error: 'Forbidden: You can only delete your own models' });
            }
        }

        // Get file URL before deletion
        const [rows] = await pool.query('SELECT modelUrl FROM models WHERE id = ?', [id]);
        if (rows.length > 0) {
            const fileUrl = rows[0].modelUrl;
            // fileUrl format: /api/uploads/filename or /api/uploads/folder/filename
            // Removing '/api/uploads/' prefix to get relative path
            if (fileUrl && fileUrl.startsWith('/api/uploads/')) {
                const relativePath = fileUrl.replace('/api/uploads/', '');
                const fullPath = path.join(uploadDir, relativePath);

                // Check if it's inside an extracted folder (ZIP uploads)
                // If it looks like "folder_extracted/file.step", we should delete the WHOLE folder, not just the file.
                // Our ZIP logic names folders as "filename_extracted".
                // If relativePath contains '/', it's likely in a subfolder.
                const pathParts = relativePath.split('/');
                let pathToDelete = fullPath;

                if (pathParts.length > 1) {
                    // It is inside a folder, so delete the parent folder of the file (which is the extraction root)
                    // Be careful not to delete uploadDir itself.
                    // The extracted folder is usually immediate child of uploadDir
                    const extractedFolderName = pathParts[0];
                    pathToDelete = path.join(uploadDir, extractedFolderName);
                }

                if (fs.existsSync(pathToDelete)) {
                    // If it is a directory (extracted zip), remove recursive
                    // If it is a file, unlink
                    try {
                        const stats = fs.statSync(pathToDelete);
                        if (stats.isDirectory()) {
                            fs.rmSync(pathToDelete, { recursive: true, force: true });
                            console.log(`Deleted model directory: ${pathToDelete}`);
                        } else {
                            fs.unlinkSync(pathToDelete);
                            console.log(`Deleted model file: ${pathToDelete}`);
                        }
                    } catch (delErr) {
                        console.error(`Failed to delete file/folder: ${pathToDelete}`, delErr);
                    }
                }
            }
        }

        await pool.query('DELETE FROM hotspots WHERE model_id = ?', [id]);
        await pool.query('DELETE FROM models WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete model' });
    }
});

// --- Workshop / Session Socket Logic ---
const workshopParticipants = new Map(); // workshopId -> Map(socketId -> userData)

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-workshop', ({ workshopId, user }) => {
        socket.join(workshopId);

        if (!workshopParticipants.has(workshopId)) {
            workshopParticipants.set(workshopId, new Map());
        }

        const participants = workshopParticipants.get(workshopId);
        participants.set(socket.id, {
            ...user,
            pos: { x: 0, y: 1.6, z: 0 },
            rot: { x: 0, y: 0, z: 0 }
        });

        // Notify others
        socket.to(workshopId).emit('user-joined', { socketId: socket.id, user });

        // Send existing participants to the new user
        socket.emit('current-participants', Array.from(participants.entries()).map(([id, data]) => ({
            socketId: id,
            ...data
        })));

        console.log(`User ${user.username} joined workshop ${workshopId}`);
    });

    socket.on('update-transform', ({ workshopId, pos, rot }) => {
        const participants = workshopParticipants.get(workshopId);
        if (participants && participants.has(socket.id)) {
            const data = participants.get(socket.id);
            data.pos = pos;
            data.rot = rot;
            socket.to(workshopId).emit('participant-moved', { socketId: socket.id, pos, rot });
        }
    });

    socket.on('sync-event', ({ workshopId, type, data }) => {
        // Broadcast interactions like hotspot activation
        socket.to(workshopId).emit('workshop-event', { type, data, sender: socket.id });
    });

    socket.on('disconnect', () => {
        workshopParticipants.forEach((participants, workshopId) => {
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                socket.to(workshopId).emit('user-left', socket.id);
                console.log(`User ${socket.id} left workshop ${workshopId}`);
            }
        });
    });
});

// Workshop API Routes
app.post('/api/workshops', async (req, res) => {
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
});

app.get('/api/workshops/active', async (req, res) => {
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
});

// Get all sectors
app.get('/api/sectors', async (req, res) => {
    try {
        const [sectors] = await pool.query('SELECT name FROM sectors ORDER BY name ASC');
        // Return simple array of strings: ['Chemistry', 'Construction', ...]
        res.json(sectors.map(s => s.name));
    } catch (err) {
        console.error("Failed to fetch sectors:", err);
        res.status(500).json({ error: 'Failed to fetch sectors' });
    }
});

// --- Lessons API ---

// Get all lessons
app.get('/api/lessons', async (req, res) => {
    try {
        const [lessons] = await pool.query(`
            SELECT l.*, s.name as sectorName, u.username as authorName, u.profilePicUrl as authorPic
            FROM lessons l
            LEFT JOIN sectors s ON l.sector_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            ORDER BY l.created_at DESC
        `);
        res.json(lessons);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch lessons' });
    }
});

// Get single lesson with steps
app.get('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [lessons] = await pool.query(`
            SELECT l.*, s.name as sectorName, u.username as authorName 
            FROM lessons l
            LEFT JOIN sectors s ON l.sector_id = s.id
            LEFT JOIN users u ON l.author_id = u.id
            WHERE l.id = ?
        `, [id]);

        if (lessons.length === 0) return res.status(404).json({ error: 'Lesson not found' });

        const lesson = lessons[0];

        const [steps] = await pool.query(`
            SELECT ls.*, m.modelUrl, m.name as modelName 
            FROM lesson_steps ls 
            LEFT JOIN models m ON ls.model_id = m.id 
            WHERE ls.lesson_id = ? 
            ORDER BY ls.step_order ASC
        `, [id]);

        lesson.steps = steps;
        res.json(lesson);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch lesson' });
    }
});

// Create Lesson
app.post('/api/lessons', async (req, res) => {
    const { title, description, sector_id, steps, image_url } = req.body;
    const requestor = req.headers['x-user-name']; // Username

    try {
        // Get User ID from Username
        const [users] = await pool.query('SELECT id, role FROM users WHERE username = ?', [requestor]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found' });

        const user = users[0];
        if (user.role !== 'admin' && user.role !== 'teacher') {
            return res.status(403).json({ error: 'Only teachers and admins can create lessons' });
        }

        const id = 'lesson-' + Date.now();
        await pool.query(
            'INSERT INTO lessons (id, title, description, sector_id, author_id, image_url) VALUES (?, ?, ?, ?, ?, ?)',
            [id, title, description, sector_id, user.id, image_url || null]
        );

        // Insert Steps if present
        if (steps && Array.isArray(steps) && steps.length > 0) {
            const stepValues = steps.map((s, index) => [
                s.id || 'step-' + Date.now() + '-' + index,
                id,
                index + 1, // step_order
                s.title,
                s.content,
                s.model_id || null,  // Ensure empty string becomes null
                s.hotspot_id || null,
                s.image_url || null
            ]);

            await pool.query(
                'INSERT INTO lesson_steps (id, lesson_id, step_order, title, content, model_id, hotspot_id, image_url) VALUES ?',
                [stepValues]
            );
        }

        res.json({ id, title, description, sector_id, author_id: user.id, steps });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create lesson' });
    }
});

// Update Lesson (Metadata + Steps)
app.put('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const { title, description, sector_id, steps, image_url } = req.body;
    const requestor = req.headers['x-user-name'];

    try {
        // Auth check
        const [users] = await pool.query('SELECT id, role FROM users WHERE username = ?', [requestor]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found' });
        const user = users[0];

        // Ownership check
        const [existing] = await pool.query('SELECT author_id FROM lessons WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Lesson not found' });

        if (user.role !== 'admin' && existing[0].author_id !== user.id) {
            return res.status(403).json({ error: 'You can only edit your own lessons' });
        }

        // Update Metadata
        await pool.query(
            'UPDATE lessons SET title=?, description=?, sector_id=?, image_url=? WHERE id=?',
            [title, description, sector_id, image_url || null, id]
        );

        // Update Steps (Delete all and insert)
        if (steps && Array.isArray(steps)) {
            await pool.query('DELETE FROM lesson_steps WHERE lesson_id = ?', [id]);

            if (steps.length > 0) {
                const stepValues = steps.map((s, index) => [
                    s.id || 'step-' + Date.now() + '-' + index,
                    id,
                    index + 1, // step_order
                    s.title,
                    s.content,
                    s.model_id || null,
                    s.hotspot_id || null,
                    s.image_url || null
                ]);

                await pool.query(
                    'INSERT INTO lesson_steps (id, lesson_id, step_order, title, content, model_id, hotspot_id, image_url) VALUES ?',
                    [stepValues]
                );
            }
        }

        res.json({ success: true, id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update lesson' });
    }
});

// Delete Lesson
app.delete('/api/lessons/:id', async (req, res) => {
    const { id } = req.params;
    const requestor = req.headers['x-user-name'];

    try {
        const [users] = await pool.query('SELECT id, role FROM users WHERE username = ?', [requestor]);
        if (users.length === 0) return res.status(401).json({ error: 'User not found' });
        const user = users[0];

        const [existing] = await pool.query('SELECT author_id FROM lessons WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Lesson not found' });

        if (user.role !== 'admin' && existing[0].author_id !== user.id) {
            return res.status(403).json({ error: 'You can only delete your own lessons' });
        }

        await pool.query('DELETE FROM lessons WHERE id = ?', [id]); // Cascades to steps
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete lesson' });
    }
});

// Serve static files from the React build
app.use(express.static(path.join(__dirname, '../dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
