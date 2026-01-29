import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.post('/', userController.createUser); // Admin create
router.get('/', userController.getAllUsers); // Admin list
router.get('/public/:username', userController.getPublicProfile);
router.put('/:id', userController.updateUser); // Admin update role
router.put('/:id/profile', userController.updateProfile); // Self update
router.delete('/:id', userController.deleteUser); // Admin delete

export default router;
