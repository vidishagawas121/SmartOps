import { Router } from 'express';
import {
  getAttendance,
  getHistory,
  getLive,
  getAnalytics,
  getByDriverId,
  startDuty,
  startBreak,
  endBreak,
  endDuty,
  updateAttendance,
  deleteAttendance
} from '../controllers/attendanceController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Secure attendance endpoints
router.use(authenticateJWT);

router.get('/', getAttendance);
router.get('/history', getHistory);
router.get('/live', getLive);
router.get('/analytics', getAnalytics);
router.get('/:driverId', getByDriverId);
router.post('/start-duty', startDuty);
router.post('/start-break', startBreak);
router.post('/end-break', endBreak);
router.post('/end-duty', endDuty);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

export default router;
