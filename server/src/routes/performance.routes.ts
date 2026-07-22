import express from 'express';
import {
  getAllPerformances,
  getPerformanceById,
  createPerformance,
  updatePerformance,
  deletePerformance,
} from '../controllers/performance.controller';

const router = express.Router();

router.get('/', getAllPerformances);
router.get('/:id', getPerformanceById);
router.post('/', createPerformance);
router.put('/:id', updatePerformance);
router.delete('/:id', deletePerformance);

export default router;
