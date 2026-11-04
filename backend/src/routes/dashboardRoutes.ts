import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getDashboardSummary);
router.get('/stats', getDashboardSummary);

export default router;
