import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadDir } from '../services/fileService.js';
import * as uploadController from '../controllers/uploadController.js';

const router = express.Router();

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create a dedicated folder for this upload
        // naming convention: type_filename_shorthash (e.g. glb_motor_x92k1)
        
        const namePart = path.parse(file.originalname).name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        // Short random hash (6 chars)
        const hash = Math.random().toString(36).substring(2, 8);
        
        const folderName = `${namePart}_${hash}`;
        const finalDir = path.join(uploadDir, folderName);

        if (!fs.existsSync(finalDir)) {
            fs.mkdirSync(finalDir, { recursive: true });
        }
        
        cb(null, finalDir);
    },
    filename: function (req, file, cb) {
        // We are already in a unique folder, so just keep the original name or simple safe name
        // But keeping a unique suffix doesn't hurt.
        // Let's keep it simple: originalname (sanitized)
        cb(null, file.originalname);
    },
});

const upload = multer({ storage: storage });

router.post(
    '/',
    (req, res, next) => {
        upload.single('file')(req, res, (err) => {
            if (err) {
                console.error('Multer error:', err);
                return res.status(500).json({ error: err.message });
            }
            next();
        });
    },
    uploadController.uploadFile
);

export default router;
