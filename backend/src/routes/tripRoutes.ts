import { Router } from 'express';
import {
  getTrips,
  createTrip,
  updateTrip,
  getActiveTrip,
  getTripById,
  getTripLiveTracking,
  getLocationHistory,
  assignTrip,
  acceptTrip,
  startTrip,
  updateLocation,
  arriveStop,
  completeStop,
  reportDelay,
  reportIncident,
  completeTrip,
  cancelTrip
} from '../controllers/tripController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getTrips);
router.get('/active', getActiveTrip);
router.get('/:id/live-tracking', getTripLiveTracking);
router.get('/:id/location-history', getLocationHistory);
router.get('/:id', getTripById);

router.post('/', createTrip);
router.post('/:id/assign', assignTrip);
router.post('/:id/accept', acceptTrip);
router.post('/:id/start', startTrip);
router.post('/:id/location', updateLocation);
router.put('/start', startTrip);
router.put('/update-location', updateLocation);

router.post('/:id/stops/:stopId/arrive', arriveStop);
router.post('/:id/stops/:stopId/complete', completeStop);
router.post('/:id/delay', reportDelay);
router.post('/:id/incident', reportIncident);
router.post('/:id/end', completeTrip);

router.put('/complete', completeTrip);
router.put('/:id/cancel', cancelTrip);
router.put('/:id', updateTrip);

export default router;
