import express from 'express';
import {
  getDashboardStats,
  getDepartmentStats,
  getAttendanceTrends,
  getRadarData,
  getRevenueData,
  getProductivityData,
} from '../controllers/analytics.controller';

const router = express.Router();

router.get('/dashboard', getDashboardStats);
router.get('/departments', getDepartmentStats);
router.get('/attendance-trends', getAttendanceTrends);
router.get('/radar', getRadarData);
router.get('/revenue', getRevenueData);
router.get('/productivity', getProductivityData);

export default router;
