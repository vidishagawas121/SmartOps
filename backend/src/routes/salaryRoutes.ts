import { Router } from 'express';
import { getSalaries, createSalary, updateSalary, deleteSalary } from '../controllers/salaryController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getSalaries);
router.post('/', createSalary);
router.put('/:id', updateSalary);
router.delete('/:id', deleteSalary);

export default router;
