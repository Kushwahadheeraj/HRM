import express from 'express';
import {
  getAttendance,
  getEmployeeAttendance,
  getAttendanceByDate,
  getTodayAttendance,
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getDashboardStats,
  getClockInDistribution,
  getAttendanceHeatmap,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getTeamAttendance,
  getPendingApprovals,
  approveAttendance,
  rejectAttendance,
} from '../controllers/attendance.controller';

const router = express.Router();

// Dashboard & Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/clock-in-distribution', getClockInDistribution);
router.get('/heatmap', getAttendanceHeatmap);

// Attendance endpoints
router.get('/', getAttendance);
router.get('/date/:date', getAttendanceByDate);
router.get('/employee/:employeeId', getEmployeeAttendance);
router.get('/today/:employeeId', getTodayAttendance);
router.get('/team/:managerName', getTeamAttendance);

// Clock in/out
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);

// Break management
router.post('/start-break', startBreak);
router.post('/end-break', endBreak);

// CRUD operations
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

// Approval endpoints
router.get('/pending-approvals', getPendingApprovals);
router.post('/:id/approve', approveAttendance);
router.post('/:id/reject', rejectAttendance);

export default router;
