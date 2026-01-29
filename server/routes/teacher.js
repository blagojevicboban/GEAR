import express from 'express';
import { getTeacherStats } from '../controllers/lessonController.js';

const router = express.Router();

router.get('/stats', getTeacherStats);

export default router;
