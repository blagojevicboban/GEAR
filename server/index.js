import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import modelRoutes from './routes/models.js';
import uploadRoutes from './routes/uploads.js';
import workshopRoutes from './routes/workshops.js';
import sectorRoutes from './routes/sectors.js';
import lessonRoutes from './routes/lessons.js';
import teacherRoutes from './routes/teacher.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import academyRoutes from './routes/academy.js';

// Services & Config
import { setupSocket } from './config/socket.js';
import { uploadDir } from './services/fileService.js';
import { runMigrations } from './services/migrationService.js';
import setupLTI from './lti.js';

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

app.use(cors());
app.use(bodyParser.json());

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploads
app.use('/uploads', express.static(uploadDir));
app.use('/api/uploads', express.static(uploadDir));

// API Routes
app.use('/api', authRoutes); // Auth (login/register)
app.use('/api/users', userRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/upload', uploadRoutes); // Note: singlular /upload in original, but filename is uploads.js. Checked route logic.
app.use('/api/workshops', workshopRoutes);
app.use('/api/sectors', sectorRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/teacher', teacherRoutes); // /api/teacher/stats
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/academy', academyRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Setup Socket.io
setupSocket(io);

// Client Serving (Production)
app.use(express.static(path.join(__dirname, '../dist')));

// Start Server
runMigrations().then(() => {
    setupLTI(app).then(() => {
        // Handle React routing - fallback must be last
        app.get('*', (req, res) => {
            const ext = path.extname(req.path);
            if (req.path.startsWith('/api') || (ext && ext !== '.html')) {
                return res.status(404).send('Not Found');
            }
            res.sendFile(path.join(__dirname, '../dist/index.html'));
        });

        httpServer.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch(err => {
        console.error('Failed to start server (LTI Error):', err);
        process.exit(1);
    });
});
