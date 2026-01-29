import express from 'express';
import * as academyController from '../controllers/academyController.js';

const router = express.Router();

router.get('/', academyController.getVideos);
router.post('/', academyController.addVideo);
router.delete('/:id', academyController.deleteVideo);
router.put('/:id', academyController.updateVideo);

export default router;
