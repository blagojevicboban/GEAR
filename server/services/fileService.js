import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// We need to point to server/uploads, assuming this file is in server/services/fileService.js
export const uploadDir = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const extractZip = async (filePath, originalName) => {
    try {
        const AdmZip = (await import('adm-zip')).default;
        const zip = new AdmZip(filePath);
        // Original logic used req.file.filename (without extension) for folder name.
        // We'll assume the caller passes unique name or we derive it.
        const baseName = path.basename(filePath, '.zip');
        const extractDir = path.join(uploadDir, baseName + '_extracted');

        // Extract all
        zip.extractAllTo(extractDir, true);
        console.log(`Extracted ZIP to: ${extractDir}`);

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
        const extensions = [
            '.step',
            '.stp',
            '.sldasm',
            '.catproduct',
            '.iam',
            '.asm',
        ];
        const candidates = allFiles.filter((f) =>
            extensions.includes(path.extname(f).toLowerCase())
        );

        let mainFile;
        const rootFiles = candidates.filter(
            (f) => path.dirname(f) === extractDir
        );

        if (rootFiles.length > 0) {
            mainFile = rootFiles.sort(
                (a, b) => fs.statSync(b).size - fs.statSync(a).size
            )[0];
        } else if (candidates.length > 0) {
            mainFile = candidates.sort(
                (a, b) => fs.statSync(b).size - fs.statSync(a).size
            )[0];
        }

        // Fallback to parts
        if (!mainFile) {
            const parts = allFiles.filter((f) =>
                ['.sldprt', '.ipt', '.prt', '.catpart'].includes(
                    path.extname(f).toLowerCase()
                )
            );
            if (parts.length > 0) mainFile = parts[0];
        }

        if (mainFile) {
            const relativePath = path.relative(uploadDir, mainFile);
            const newFileUrl = `/api/uploads/${relativePath}`;
            return { url: newFileUrl, isAssembly: true };
        }

        return null; // Extraction worked but no main file found
    } catch (zipErr) {
        console.error('ZIP extraction failed:', zipErr);
        throw zipErr;
    }
};

export const deleteFile = (relativePath) => {
    // Implementation extracted from delete check
    const fullPath = path.join(uploadDir, relativePath);
    const pathParts = relativePath.split('/');
    let pathToDelete = fullPath;

    if (pathParts.length > 1) {
        const extractedFolderName = pathParts[0];
        pathToDelete = path.join(uploadDir, extractedFolderName);
    }

    if (fs.existsSync(pathToDelete)) {
        try {
            const stats = fs.statSync(pathToDelete);
            if (stats.isDirectory()) {
                fs.rmSync(pathToDelete, { recursive: true, force: true });
                console.log(`Deleted directory: ${pathToDelete}`);
            } else {
                fs.unlinkSync(pathToDelete);
                console.log(`Deleted file: ${pathToDelete}`);
            }
        } catch (delErr) {
            console.error(`Failed to delete: ${pathToDelete}`, delErr);
        }
    }
};

export const copyFile = (sourceUrl) => {
    if (!sourceUrl || !sourceUrl.startsWith('/api/uploads/')) return sourceUrl;

    try {
        const relativePath = sourceUrl.replace('/api/uploads/', '');
        // Handle URL fragments if any (like #test)
        const cleanRelativePath = relativePath.split('#')[0];
        const fragment = relativePath.includes('#') ? '#' + relativePath.split('#')[1] : '';

        const sourcePath = path.join(uploadDir, cleanRelativePath);
        
        if (!fs.existsSync(sourcePath)) {
            console.warn(`Source file not found for copy: ${sourcePath}`);
            return sourceUrl; 
        }

        const pathParts = cleanRelativePath.split('/');
        
        // If it looks like a folder structure (length > 1), we treat the top-level folder as the unit to copy
        // This matches deleteFile logic where we delete the whole extracted folder
        if (pathParts.length > 1) {
            const rootFolderName = pathParts[0];
            const sourceDir = path.join(uploadDir, rootFolderName);
            
            // Generate new folder name
            const newDirName = `${rootFolderName}_copy_${Date.now()}`;
            const newDir = path.join(uploadDir, newDirName);

            // Copy recursively
            fs.cpSync(sourceDir, newDir, { recursive: true });

            // Construct new URL
            // Original: folder/sub/file.ext -> New: folder_copy_123/sub/file.ext
            const restOfPath = pathParts.slice(1).join('/');
            return `/api/uploads/${newDirName}/${restOfPath}${fragment}`;
        } else {
            // Single file in root uploads
            const ext = path.extname(cleanRelativePath);
            const namePart = path.basename(cleanRelativePath, ext);
            const newFilename = `${namePart}_copy_${Date.now()}${ext}`;
            const newPath = path.join(uploadDir, newFilename);

            fs.copyFileSync(sourcePath, newPath);
            return `/api/uploads/${newFilename}${fragment}`;
        }
    } catch (err) {
        console.error('Failed to copy file:', err);
        return sourceUrl; // Fallback to original, risky but better than crash
    }
};

export const moveFileToFolder = (fileUrl, targetUrl) => {
    if (!fileUrl || !fileUrl.startsWith('/api/uploads/') || !targetUrl || !targetUrl.startsWith('/api/uploads/')) {
        return fileUrl;
    }

    try {
        const fileRel = fileUrl.replace('/api/uploads/', '');
        const targetRel = targetUrl.replace('/api/uploads/', '');
        
        // Target folder is the first part of the target path
        const targetParts = targetRel.split('/');
        if (targetParts.length < 2) return fileUrl; // Target is in root, cannot consolidate to folder
        
        const targetFolder = targetParts[0];
        const targetDir = path.join(uploadDir, targetFolder);
        
        // File details
        const fileParts = fileRel.split('/');
        // If file is already in the target folder, do nothing
        if (fileParts.length > 1 && fileParts[0] === targetFolder) return fileUrl;

        // Current location
        const fileCleanRel = fileRel.split('#')[0]; // removal hash
        const fileHash = fileRel.includes('#') ? '#' + fileRel.split('#')[1] : '';
        const sourcePath = path.join(uploadDir, decodeURIComponent(fileCleanRel));
        
        if (!fs.existsSync(sourcePath)) return fileUrl;

        // Move
        const fileName = path.basename(sourcePath);
        const destPath = path.join(targetDir, fileName);
        
        // Avoid overwrite if name conflict
        if (fs.existsSync(destPath)) {
            // Add a suffix
             const ext = path.extname(fileName);
             const name = path.basename(fileName, ext);
             const newName = `${name}_${Date.now()}${ext}`;
             const newDestPath = path.join(targetDir, newName);
             fs.renameSync(sourcePath, newDestPath);
             return `/api/uploads/${targetFolder}/${newName}${fileHash}`;
        } else {
            fs.renameSync(sourcePath, destPath);
        }

        // Cleanup old folder if empty
        const sourceDir = path.dirname(sourcePath);
        if (sourceDir !== uploadDir) {
             try {
                 if (fs.readdirSync(sourceDir).length === 0) {
                     fs.rmdirSync(sourceDir);
                     console.log(`Cleaned up empty folder: ${sourceDir}`);
                 }
             } catch (e) { /* ignore */ }
        }

        return `/api/uploads/${targetFolder}/${fileName}${fileHash}`;
    } catch (err) {
        console.error('Failed to move file:', err);
        return fileUrl;
    }
};

export const consolidateLessonFiles = (lessonId, title, imageUrl, steps) => {
    // 1. Determine Folder
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const hash = lessonId.split('-').pop(); // simple hash from id or random
    const folderName = `lesson_${safeTitle}_${hash}`;
    const targetDir = path.join(uploadDir, folderName);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const moveResult = (fileUrl) => {
        if (!fileUrl || !fileUrl.startsWith('/api/uploads/')) return fileUrl;
        
        try {
            const relativePath = fileUrl.replace('/api/uploads/', '');
            const cleanRelativePath = relativePath.split('#')[0];
            const hashPart = relativePath.includes('#') ? '#' + relativePath.split('#')[1] : '';
            const sourcePath = path.join(uploadDir, decodeURIComponent(cleanRelativePath));

            if (!fs.existsSync(sourcePath)) return fileUrl;

            // Check if already in correct folder
            const parentDir = path.dirname(sourcePath);
            if (path.basename(parentDir) === folderName) return fileUrl;

            const fileName = path.basename(sourcePath);
            const destPath = path.join(targetDir, fileName);

            if (fs.existsSync(destPath) && sourcePath !== destPath) {
                 // Rename
                 const ext = path.extname(fileName);
                 const name = path.basename(fileName, ext);
                 const newName = `${name}_${Date.now()}${ext}`;
                 fs.renameSync(sourcePath, path.join(targetDir, newName));
                 return `/api/uploads/${folderName}/${newName}${hashPart}`;
            } else if (sourcePath !== destPath) {
                fs.renameSync(sourcePath, destPath);
            }
            
            // Cleanup source dir if empty
            if (path.dirname(sourcePath) !== uploadDir) {
                 try {
                     if (fs.readdirSync(path.dirname(sourcePath)).length === 0) {
                         fs.rmdirSync(path.dirname(sourcePath));
                     }
                 } catch(e) {}
            }

            return `/api/uploads/${folderName}/${fileName}${hashPart}`;
        } catch (e) {
            console.error('Lesson file move failed', e);
            return fileUrl;
        }
    };

    let newImageUrl = imageUrl;
    if (imageUrl) {
        newImageUrl = moveResult(imageUrl);
    }

    let newSteps = steps;
    if (steps && Array.isArray(steps)) {
        newSteps = steps.map(step => {
            let updatedStep = { ...step };
            
            // Step Image
            if (step.image_url) {
                updatedStep.image_url = moveResult(step.image_url);
            }

            // Step Content
            if (step.content && step.content.includes('/api/uploads/')) {
                const regex = /src="(\/api\/uploads\/[^"]+)"/g;
                updatedStep.content = step.content.replace(regex, (match, url) => {
                    const newUrl = moveResult(url);
                    return `src="${newUrl}"`;
                });
            }
            return updatedStep;
        });
    }

    return { imageUrl: newImageUrl, steps: newSteps };
};
