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

const migrate = async () => {
    console.log('Starting migration...');
    const connection = await pool.getConnection();

    try {
        const [models] = await connection.query('SELECT id, name, modelUrl, thumbnailUrl FROM models');
        console.log(`Found ${models.length} models to check.`);

        for (const model of models) {
            console.log(`Processing model ${model.id}: ${model.name}`);
            let updates = {};

            // Helper to migrate or rename file path
            const processFile = (fileUrl, isThumbnail = false) => {
                if (!fileUrl) return null;
                
                // Skip external URLs
                if (fileUrl.startsWith('http') && !fileUrl.includes(process.env.CLIENT_URL || 'localhost')) {
                   console.log(`Skipping external URL: ${fileUrl}`);
                   return null;
                }

                // Normalizing prefix locally
                let cleanUrl = fileUrl;
                if (cleanUrl.startsWith('/uploads/')) {
                    cleanUrl = cleanUrl.replace('/uploads/', '/api/uploads/');
                }
                
                if (!cleanUrl.startsWith('/api/uploads/')) {
                    console.log(`Skipping non-upload path: ${fileUrl}`);
                    return null;
                }
                
                // Extract hash/fragment if present
                const urlParts = cleanUrl.split('#');
                const pathWithoutHash = urlParts[0];
                const hashPart = urlParts.length > 1 ? '#' + urlParts[1] : '';

                const relativePath = pathWithoutHash.replace('/api/uploads/', '');
                // Decode URI components in case of escaped chars
                const decodedPath = decodeURIComponent(relativePath);
                
                const parts = decodedPath.split('/');
                const fileName = parts[parts.length - 1];
                const ext = path.extname(fileName).replace('.', '').toLowerCase();
                const namePart = path.parse(fileName).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                
                let currentDir = parts.length > 1 ? path.join(uploadDir, parts[0]) : uploadDir;
                let currentFilePath = path.join(uploadDir, decodedPath);
                
                if (!fs.existsSync(currentFilePath)) {
                    console.warn(`File not found: ${currentFilePath}`);
                    return null;
                }

                const expectedPrefix = `${ext}_`;
                const parentFolderName = parts.length > 1 ? parts[0] : '';
                
                 // If it's already in a folder matching the new convention, skip
                 // We relax the check: just needs to be a subfolder that starts with extension
                if (parts.length > 1 && parentFolderName.startsWith(expectedPrefix)) {
                    // Normalize DB url if it was /uploads/
                    if (fileUrl !== cleanUrl) {
                        return cleanUrl; // Just update the prefix
                    }
                    return null;
                }

                // Create new folder
                const hash = Math.random().toString(36).substring(2, 8);
                const newFolderName = `${ext}_${namePart}_${hash}`;
                const newDir = path.join(uploadDir, newFolderName);
                
                if (!fs.existsSync(newDir)) {
                    fs.mkdirSync(newDir, { recursive: true });
                }

                const destPath = path.join(newDir, fileName);
                
                // Move file
                try {
                    fs.renameSync(currentFilePath, destPath);
                    console.log(`Migrated ${fileName} -> ${newFolderName}/${fileName}`);
                    
                    // Cleanup old empty dir
                    if (parts.length > 1) {
                         try {
                             if (fs.readdirSync(currentDir).length === 0) {
                                 fs.rmdirSync(currentDir);
                                 console.log(`Removed empty dir: ${currentDir}`);
                             }
                         } catch (e) {
                             // Ignore
                         }
                    }
                    
                    return `/api/uploads/${newFolderName}/${fileName}${hashPart}`;
                } catch (err) {
                    console.error(`Error moving file ${fileName}:`, err);
                    return null;
                }
            };

            const newModelUrl = processFile(model.modelUrl);
            if (newModelUrl) updates.modelUrl = newModelUrl;

            // Thumbnail
            if (model.thumbnailUrl && model.thumbnailUrl.startsWith('/api/uploads/')) {
                let currentModelUrl = updates.modelUrl || model.modelUrl;
                
                // Only proceed if we have a valid local model URL
                if (currentModelUrl && currentModelUrl.startsWith('/api/uploads/')) {
                     const modelRel = currentModelUrl.replace('/api/uploads/', '');
                     const modelParts = modelRel.split('/');
                     
                     // If model is in a subfolder (which it should be now)
                     if (modelParts.length > 1) {
                         const targetFolder = modelParts[0];
                         const thumbRel = model.thumbnailUrl.replace('/api/uploads/', '');
                         const thumbParts = thumbRel.split('/');
                         
                         // If thumbnail is NOT in the same folder
                         if (thumbParts.length <= 1 || thumbParts[0] !== targetFolder) {
                             const thumbName = path.basename(thumbRel);
                             // Handle hash removal for file lookup
                             const thumbCleanRel = thumbRel.split('#')[0];
                             const thumbHash = thumbRel.includes('#') ? '#' + thumbRel.split('#')[1] : '';
                             
                             const oldThumbPath = path.join(uploadDir, decodeURIComponent(thumbCleanRel));
                             const newThumbPath = path.join(uploadDir, targetFolder, thumbName);
                             
                             if (fs.existsSync(oldThumbPath) && oldThumbPath !== newThumbPath) {
                                 // Check for collision
                                 if (fs.existsSync(newThumbPath)) {
                                     const ext = path.extname(thumbName);
                                     const name = path.basename(thumbName, ext);
                                     const newName = `${name}_${Date.now()}${ext}`;
                                     const newDest = path.join(uploadDir, targetFolder, newName);
                                     fs.renameSync(oldThumbPath, newDest);
                                     updates.thumbnailUrl = `/api/uploads/${targetFolder}/${newName}${thumbHash}`;
                                 } else {
                                     fs.renameSync(oldThumbPath, newThumbPath);
                                     updates.thumbnailUrl = `/api/uploads/${targetFolder}/${thumbName}${thumbHash}`;
                                 }
                                 console.log(`Consolidated thumb -> ${targetFolder}/...`);
                                 
                                 // Cleanup old dir if empty
                                 const oldThumbDir = path.dirname(oldThumbPath);
                                 if (oldThumbDir !== uploadDir) {
                                      try {
                                         if (fs.readdirSync(oldThumbDir).length === 0) {
                                             fs.rmdirSync(oldThumbDir);
                                             console.log('Removed empty thumb dir');
                                         }
                                     } catch(e) {}
                                 }
                             }
                         }
                     }
                }
            }

            // Update DB if needed
            if (Object.keys(updates).length > 0) {
                const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
                const values = [...Object.values(updates), model.id];
                await connection.query(`UPDATE models SET ${setClause} WHERE id = ?`, values);
                console.log(`Updated DB for model ${model.id}`);
            }
        }
        
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        connection.release();
        process.exit();
    }
};

migrate();
