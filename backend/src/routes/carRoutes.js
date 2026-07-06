import { Router } from 'express';
import { searchCars } from '../controllers/carController.js';

const router = Router();

router.post('/search', searchCars);
router.get('/health', (req, res) => res.json({ status: 'OK' }));

export default router;