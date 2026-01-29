import express from 'express';
import * as workshopController from '../controllers/workshopController.js';

const router = express.Router();

router.post('/', workshopController.createWorkshop);
router.get('/active', workshopController.getActiveWorkshops);

export default router;
