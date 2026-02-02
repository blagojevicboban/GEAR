import express from 'express';
import * as modelController from '../controllers/modelController.js';

const router = express.Router();

router.get('/', modelController.getModels);
router.post('/', modelController.createModel);
router.put('/:id', modelController.updateModel);
router.delete('/:id', modelController.deleteModel);
router.post('/:id/optimize', modelController.optimize);
router.post('/:id/clone', modelController.duplicateModel);
// Lesson gen is somewhat related to models/AI
router.post('/ai/generate-lesson', modelController.generateLesson);

export default router;
