import express from 'express';
import * as sectorController from '../controllers/sectorController.js';

const router = express.Router();

router.get('/', sectorController.getAllSectors);
router.post('/', sectorController.createSector);
router.delete('/:name', sectorController.deleteSector);
router.put('/:name', sectorController.renameSector);

export default router;
