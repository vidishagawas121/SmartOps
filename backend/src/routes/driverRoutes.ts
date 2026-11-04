import { Router } from 'express';
import {
  recordLocation,
  getDriverLatestLocation,
  getTripLocationHistory
} from '../controllers/locationController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Protect driver location endpoints
router.use(authenticateJWT);

router.post('/location', recordLocation);
router.get('/location/trip/:tripId', getTripLocationHistory);
router.get('/location/:driverId', getDriverLatestLocation);

export default router;
