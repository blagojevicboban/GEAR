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

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'gear',
    password: process.env.DB_PASSWORD || 'Tsp-2024',
    database: process.env.DB_NAME || 'gear',
    waitForConnections: true,
    connectionLimit: 1,
});

// Helper to move file
const moveFile = (fileUrl, targetDir) => {
    if (!fileUrl || !fileUrl.startsWith('/api/uploads/')) return fileUrl;

    try {
        const relativePath = fileUrl.replace('/api/uploads/', '');
        // Handle URL fragments
        const cleanRelativePath = relativePath.split('#')[0];
        const hashPart = relativePath.includes('#') ? '#' + relativePath.split('#')[1] : '';
        const sourcePath = path.join(uploadDir, decodeURIComponent(cleanRelativePath));

        if (!fs.existsSync(sourcePath)) {
            // console.warn(`File not found: ${sourcePath}`);
            return fileUrl;
        }

        const fileName = path.basename(sourcePath);
        const destPath = path.join(targetDir, fileName);

        // Check if already in place
        if (sourcePath === destPath) return fileUrl;

        // Move
        if (fs.existsSync(destPath)) {
            // Rename if collision
             const ext = path.extname(fileName);
             const name = path.basename(fileName, ext);
             const newName = `${name}_${Date.now()}${ext}`;
             const newDestPath = path.join(targetDir, newName);
             fs.renameSync(sourcePath, newDestPath);
             const folderName = path.basename(targetDir);
             return `/api/uploads/${folderName}/${newName}${hashPart}`;
        } else {
            fs.renameSync(sourcePath, destPath);
        }

        // Cleanup old folder
        const sourceDir = path.dirname(sourcePath);
        if (sourceDir !== uploadDir && sourceDir.includes('uploads')) {
             try {
                 if (fs.readdirSync(sourceDir).length === 0) {
                     fs.rmdirSync(sourceDir);
                 }
             } catch (e) {}
        }
        
        const folderName = path.basename(targetDir);
        return `/api/uploads/${folderName}/${fileName}${hashPart}`;
    } catch (err) {
        console.error(`Failed to move ${fileUrl}:`, err);
        return fileUrl;
    }
};

const migrateLessons = async () => {
    console.log('Starting lesson migration...');
    const connection = await pool.getConnection();

    try {
        const [lessons] = await connection.query('SELECT * FROM lessons');
        console.log(`Found ${lessons.length} lessons.`);

        for (const lesson of lessons) {
            console.log(`Processing lesson: ${lesson.title}`);
            
            // 1. Determine Folder Name
            const safeTitle = lesson.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const hash = lesson.id.split('-').pop(); // simple hash from id
            const folderName = `lesson_${safeTitle}_${hash}`;
            const targetDir = path.join(uploadDir, folderName);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            let lessonUpdates = {};
            
            // 2. Migrate Main Image
            if (lesson.image_url) {
                const newUrl = moveFile(lesson.image_url, targetDir);
                if (newUrl !== lesson.image_url) {
                    lessonUpdates.image_url = newUrl;
                }
            }

            // 3. Migrate Steps
            const [steps] = await connection.query('SELECT * FROM lesson_steps WHERE lesson_id = ?', [lesson.id]);
            
            for (const step of steps) {
                let stepUpdates = {};
                
                // Step Image
                if (step.image_url) {
                    const newStepUrl = moveFile(step.image_url, targetDir);
                    if (newStepUrl !== step.image_url) {
                        stepUpdates.image_url = newStepUrl;
                    }
                }

                // Step Content
                if (step.content && step.content.includes('/api/uploads/')) {
                    let newContent = step.content;
                    // Regex to find src="/api/uploads/..."
                    // We iterate matches manually to handle replacements
                    const regex = /src="(\/api\/uploads\/[^"]+)"/g;
                    let match;
                    let replaced = false;
                    
                    // We gather updates first to avoid regex iteration issues
                    const replacements = [];
                    
                    while ((match = regex.exec(step.content)) !== null) {
                        const originalUrl = match[1];
                        const newUrl = moveFile(originalUrl, targetDir);
                        if (newUrl !== originalUrl) {
                            replacements.push({ original: originalUrl, new: newUrl });
                        }
                    }

                    for (const rep of replacements) {
                         newContent = newContent.replace(rep.original, rep.new);
                         replaced = true;
                    }

                    if (replaced) {
                        stepUpdates.content = newContent;
                    }
                }

                if (Object.keys(stepUpdates).length > 0) {
                     const setClause = Object.keys(stepUpdates).map(k => `${k} = ?`).join(', ');
                     const values = [...Object.values(stepUpdates), step.id];
                     await connection.query(`UPDATE lesson_steps SET ${setClause} WHERE id = ?`, values);
                     console.log(`Updated step ${step.id}`);
                }
            }

            // Update Lesson
            if (Object.keys(lessonUpdates).length > 0) {
                 const setClause = Object.keys(lessonUpdates).map(k => `${k} = ?`).join(', ');
                 const values = [...Object.values(lessonUpdates), lesson.id];
                 await connection.query(`UPDATE lessons SET ${setClause} WHERE id = ?`, values);
                 console.log(`Updated lesson ${lesson.id}`);
            }
            
            // Cleanup empty folder if we didn't use it?
            // Actually, if we created it but moved nothing, maybe remove it.
             try {
                 if (fs.readdirSync(targetDir).length === 0) {
                     fs.rmdirSync(targetDir);
                 }
             } catch(e) {}
        }

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        connection.release();
        process.exit();
    }
};

migrateLessons();
