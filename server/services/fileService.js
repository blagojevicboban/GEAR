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
