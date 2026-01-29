import express from 'express';
import multer from 'multer';
import { uploadDir } from '../services/fileService.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();
const upload = multer({ dest: uploadDir }); // Temp storage for restores

router.get('/logs', adminController.getLogs);
router.get('/config', adminController.getConfig);
router.put('/config', adminController.updateConfig);
router.get('/backup', adminController.getBackup);
router.post('/restore', upload.single('file'), adminController.restoreBackup);

export default router;
