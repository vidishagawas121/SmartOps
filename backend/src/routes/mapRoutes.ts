import { Router } from 'express';
import {
  geocode,
  reverseGeocodeController,
  distanceETAController,
  directionsController
} from '../controllers/mapController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Apply JWT authentication
router.use(authenticateJWT);

router.get('/geocode', geocode);
router.get('/reverse-geocode', reverseGeocodeController);
router.get('/distance-eta', distanceETAController);
router.get('/directions', directionsController);

export default router;
