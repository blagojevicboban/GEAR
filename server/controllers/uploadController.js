import { uploadDir, extractZip } from '../services/fileService.js';
import path from 'path';
import fs from 'fs';
import { getSetting } from '../services/settingsService.js';

export const uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const maxSizeMb = await getSetting('max_file_size_mb', '50');
        const maxSizeBytes = parseInt(maxSizeMb) * 1024 * 1024;

        if (req.file.size > maxSizeBytes) {
            fs.unlinkSync(req.file.path); // Delete the temp file
            return res.status(400).json({ 
                error: `File is too large. Maximum size allowed is ${maxSizeMb}MB.` 
            });
        }
    } catch (err) {
        console.error('File size check failed:', err);
    }

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    // Auto-extract ZIP files for CAD assemblies
    if (fileExt === '.zip') {
        try {
            const result = await extractZip(filePath, req.file.originalname);
            if (result) {
                return res.json({
                    url: result.url,
                    originalName: req.file.originalname,
                    isAssembly: true,
                });
            }
            // If no result (no main file found), fall through to default returns
        } catch (zipErr) {
            console.error('ZIP extraction failed:', zipErr);
        }
    }

    const fileUrl = `/api/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, originalName: req.file.originalname });
};
