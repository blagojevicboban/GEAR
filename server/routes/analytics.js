import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';

const router = express.Router();

router.post('/log', analyticsController.logAnalytics);
router.get('/heatmap/:modelId', analyticsController.getHeatmap);

export default router;
