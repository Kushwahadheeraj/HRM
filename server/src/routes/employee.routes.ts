import express from 'express';
import {
  getEmployees,
  getEmployee,
  getEmployeeByEmployeeId,
  getEmployeesByManagerName,
  createEmployee,
  bulkImportEmployees,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employee.controller';

const router = express.Router();

router.get('/', getEmployees);
router.post('/', createEmployee);
router.post('/bulk-import', bulkImportEmployees);
router.get('/manager/:managerName', getEmployeesByManagerName);
router.get('/employeeId/:employeeId', getEmployeeByEmployeeId);
router.get('/:id', getEmployee);
router.put('/:id', updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;