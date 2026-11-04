import { Router } from 'express';
import { getInventory, createInventory, updateInventory, deleteInventory } from '../controllers/inventoryController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Secure inventory paths with JWT
router.use(authenticateJWT);

router.get('/', getInventory);
router.post('/', createInventory);
router.put('/:id', updateInventory);
router.delete('/:id', deleteInventory);

export default router;
