import express from 'express';
import {
  getLeaves,
  getEmployeeLeaves,
  updateLeaveRequestStatus,
  createLeave,
  deleteLeave,
  getTeamLeaves,
} from '../controllers/leave.controller';
import {
  getEmployeeLeaveBalance,
  updateLeaveBalance
} from '../controllers/leaveBalance.controller';

const router = express.Router();

router.get('/', getLeaves);
router.post('/', createLeave);
router.get('/employee/:employeeId', getEmployeeLeaves);
router.get('/team/:managerName', getTeamLeaves);
router.patch('/:id/status', updateLeaveRequestStatus);
router.delete('/:id', deleteLeave);
router.get('/balance/:employeeId', getEmployeeLeaveBalance);
router.patch('/balance/:id', updateLeaveBalance);

export default router;