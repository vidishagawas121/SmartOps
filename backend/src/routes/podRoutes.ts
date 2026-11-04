import { Router } from 'express';
import {
  createPOD,
  getPODs,
  getDriverPODs,
  getPODById,
  approvePOD,
  rejectPOD,
  deletePOD
} from '../controllers/podController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Secure all POD endpoints
router.use(authenticateJWT);

router.post('/upload', createPOD);
router.get('/', getPODs);
router.get('/driver', getDriverPODs);
router.get('/:id', getPODById);
router.put('/approve/:id', approvePOD);
router.put('/reject/:id', rejectPOD);
router.delete('/:id', deletePOD);

export default router;
