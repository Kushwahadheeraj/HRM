import express from 'express';
import {
  getPayroll,
  getEmployeePayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
  processAllPayroll,
} from '../controllers/payroll.controller';

const router = express.Router();

router.get('/', getPayroll);
router.post('/', createPayroll);
router.post('/process', processAllPayroll);
router.get('/employee/:employeeId', getEmployeePayroll);
router.put('/:id', updatePayroll);
router.delete('/:id', deletePayroll);

export default router;