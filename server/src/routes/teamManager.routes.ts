import express from 'express';
import {
  getTeamManagers,
  getTeamManager,
  getEmployeesByManager,
  createTeamManager,
  updateTeamManager,
  deleteTeamManager,
  getTeamManagerDashboardStats,
  getTeamWeeklyAttendance
} from '../controllers/teamManager.controller';

const router = express.Router();

router.get('/', getTeamManagers);
router.get('/:id', getTeamManager);
router.get('/:managerName/employees', getEmployeesByManager);
router.get('/:managerName/dashboard', getTeamManagerDashboardStats);
router.get('/:managerName/weekly-attendance', getTeamWeeklyAttendance);
router.post('/', createTeamManager);
router.put('/:id', updateTeamManager);
router.delete('/:id', deleteTeamManager);

export default router;
