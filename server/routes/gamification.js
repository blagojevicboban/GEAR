import express from 'express';
import * as gamificationController from '../controllers/gamificationController.js';

const router = express.Router();

router.post('/scores', gamificationController.saveScore);
router.get('/scores/:modelId', gamificationController.getScores);

export default router;
