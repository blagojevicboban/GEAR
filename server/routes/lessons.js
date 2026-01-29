import express from 'express';
import * as lessonController from '../controllers/lessonController.js';

const router = express.Router();

router.get('/', lessonController.getAllLessons);
router.get('/:id', lessonController.getLessonById);
router.post('/', lessonController.createLesson);
router.put('/:id', lessonController.updateLesson);
router.delete('/:id', lessonController.deleteLesson);
router.post('/:id/attempt', lessonController.recordAttempt);

// Teacher stats - technically logic related to lessons and users. 
// "GET /api/teacher/stats" was the original.
// We can mount this router at /api OR /api/lessons.
// If mounted at /api/lessons, this becomes /api/lessons/teacher/stats? No, original was /api/teacher/stats.
// I can export `teacherStats` separately or put it in a separate user/teacher route? 
// Or I can just handle it in index.js for now? No, complete modularity.
// Let's assume we will mount a separate router for teacher stats OR put it in `users.js`?
// It fetches lesson attempts. It belongs to lessons domain more than users.
// I'll add `router.get('/teacher/stats', ...)` but if mounted at `/api/lessons`, it matches `/api/lessons/teacher/stats`. 
// The frontend calls `/api/teacher/stats`.
// So I should probably create a specific route for this or mount a router at `/api`.
// Let's create `server/routes/teacher.js` specifically for teacher util endpoints?
// Or just export the controller and use it in `index.js` or `users.js`.
// Let's put it in `server/routes/teacher.js`.

export default router;
