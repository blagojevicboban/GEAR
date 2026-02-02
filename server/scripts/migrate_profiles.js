import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(rootDir, '.env') });

const uploadDir = path.resolve(rootDir, 'server/uploads');
const profilesDir = path.join(uploadDir, 'profile_pictures');

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'gear',
    password: process.env.DB_PASSWORD || 'Tsp-2024',
    database: process.env.DB_NAME || 'gear',
    waitForConnections: true,
    connectionLimit: 1,
});

if (!fs.existsSync(profilesDir)) {
    fs.mkdirSync(profilesDir, { recursive: true });
}

// Helper to move file
const moveFile = (fileUrl) => {
    if (!fileUrl || !fileUrl.startsWith('/api/uploads/')) return fileUrl;

    try {
        const relativePath = fileUrl.replace('/api/uploads/', '');
        // Handle URL fragments
        const cleanRelativePath = relativePath.split('#')[0];
        const hashPart = relativePath.includes('#') ? '#' + relativePath.split('#')[1] : '';
        const sourcePath = path.join(uploadDir, decodeURIComponent(cleanRelativePath));

        // Skip if already in profile_pictures (avoid recursive mess if run multiple times)
        if (sourcePath.includes('/profile_pictures/')) return fileUrl;

        if (!fs.existsSync(sourcePath)) {
            // console.warn(`File not found: ${sourcePath}`);
            return fileUrl;
        }

        const fileName = path.basename(sourcePath);
        const destPath = path.join(profilesDir, fileName);

        // Check if collision
        if (fs.existsSync(destPath) && sourcePath !== destPath) {
             const ext = path.extname(fileName);
             const name = path.basename(fileName, ext);
             const newName = `${name}_${Date.now()}${ext}`;
             const newDestPath = path.join(profilesDir, newName);
             fs.renameSync(sourcePath, newDestPath);
             console.log(`Moved ${fileName} -> profile_pictures/${newName}`);
             return `/api/uploads/profile_pictures/${newName}${hashPart}`;
        } else if (sourcePath !== destPath) {
            fs.renameSync(sourcePath, destPath);
            console.log(`Moved ${fileName} -> profile_pictures/${fileName}`);
        } else {
            return fileUrl; // Already there
        }

        return `/api/uploads/profile_pictures/${fileName}${hashPart}`;
    } catch (err) {
        console.error(`Failed to move ${fileUrl}:`, err);
        return fileUrl;
    }
};

const migrateProfiles = async () => {
    console.log('Starting profile migration...');
    const connection = await pool.getConnection();

    try {
        const [users] = await connection.query('SELECT id, username, profilePicUrl FROM users WHERE profilePicUrl IS NOT NULL');
        console.log(`Found ${users.length} users with profiles.`);

        for (const user of users) {
            if (user.profilePicUrl) {
                const newUrl = moveFile(user.profilePicUrl);
                if (newUrl !== user.profilePicUrl) {
                    await connection.query('UPDATE users SET profilePicUrl = ? WHERE id = ?', [newUrl, user.id]);
                }
            }
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        connection.release();
        process.exit();
    }
};

migrateProfiles();
