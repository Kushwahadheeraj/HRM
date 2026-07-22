import mongoose from 'mongoose';
import { Request, Response } from 'express';
import Payroll from '../models/Payroll.model';
import Employee from '../models/Employee.model';
import Attendance from '../models/Attendance.model';
import Leave from '../models/Leave.model';
import { ApiResponse } from '../types';

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const calculatePayroll = async (
  employeeId: string,
  month: string,
  year: number,
  organizationId?: string | mongoose.Types.ObjectId
) => {
  // Convert organizationId to ObjectId if it's a string
  const orgId = organizationId 
    ? typeof organizationId === 'string' 
      ? new mongoose.Types.ObjectId(organizationId) 
      : organizationId 
    : undefined;
    
  // Find employee (from same organization)
  const employeeQuery: any = { employeeId };
  if (orgId) employeeQuery.organizationId = orgId;
  const employee = await Employee.findOne(employeeQuery);
  if (!employee) throw new Error('Employee not found');

  const baseSalary = Math.floor(employee.salary / 12); // Monthly base salary from annual

  // Calculate allowances
  const hra = baseSalary * 0.2; // 20% of base salary
  const bonus = baseSalary * 0.1; // 10% bonus for demo
  const otherAllowances = baseSalary * 0.08; // 8% of base salary

  // Get days in month
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.indexOf(month);
  const daysInMonth = getDaysInMonth(year, monthIndex);
  const perDaySalary = baseSalary / daysInMonth;
  const perHourSalary = perDaySalary / 8; // Assuming 8-hour workday

  // Fetch attendance for month (from same organization)
  const monthString = String(monthIndex + 1).padStart(2, '0');
  const startDate = `${year}-${monthString}-01`;
  const endDate = `${year}-${monthString}-${daysInMonth}`;

  const attendanceFilter: any = {
    employeeId,
    date: { $gte: startDate, $lte: endDate }
  };
  if (orgId) attendanceFilter.organizationId = orgId;
  const attendanceRecords = await Attendance.find(attendanceFilter);

  const leaveFilter: any = {
    employeeId,
    status: 'approved',
    $or: [
      { startDate: { $lte: endDate }, endDate: { $gte: startDate } }
    ]
  };
  if (orgId) leaveFilter.organizationId = orgId;
  const leaveRecords = await Leave.find(leaveFilter);

  // Calculate days and overtime
  let attendanceDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let halfDays = 0;
  let totalOvertimeHours = 0;

  attendanceRecords.forEach(record => {
    if (record.status === 'present' || record.status === 'late' || record.status === 'remote') {
      attendanceDays++;
    } else if (record.status === 'absent') {
      absentDays++;
    } else if (record.status === 'half-day') {
      halfDays++;
    }
    // Add overtime hours from this attendance record
    totalOvertimeHours += record.overtime || 0;
  });

  // Calculate unpaid leave days (assuming sick leave is unpaid, others are paid)
  let unpaidLeaveDays = 0;
  leaveRecords.forEach(leave => {
    // Calculate leave days in month
    const leaveStart = new Date(leave.startDate);
    const leaveEnd = new Date(leave.endDate);
    const monthStart = new Date(startDate);
    const monthEnd = new Date(endDate);

    const actualStart = leaveStart > monthStart ? leaveStart : monthStart;
    const actualEnd = leaveEnd < monthEnd ? leaveEnd : monthEnd;

    const days = Math.ceil((actualEnd.getTime() - actualStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    leaveDays += days;
    
    // Only deduct for sick leave (you can customize which leaves are unpaid)
    if (leave.type === 'sick') {
      unpaidLeaveDays += days;
    }
  });

  // Calculate overtime pay (1.5x the regular hourly rate)
  const overtimePay = totalOvertimeHours * perHourSalary * 1.5;

  // Calculate total earnings including overtime
  const totalEarnings = baseSalary + hra + bonus + otherAllowances + overtimePay;

  // Calculate deductions based on attendance
  const attendanceDeductions = absentDays * perDaySalary;
  const halfDayDeductions = halfDays * (perDaySalary / 2);
  const leaveDeductions = unpaidLeaveDays * perDaySalary;
  const otherDeductions = totalEarnings * 0.1; // 10% for tax/other (reduced from 20%)
  
  const totalDeductions = attendanceDeductions + halfDayDeductions + leaveDeductions + otherDeductions;
  const netSalary = totalEarnings - totalDeductions;

  return {
    employeeId,
    employeeName: employee.name,
    department: employee.department,
    baseSalary,
    hra,
    bonus,
    otherAllowances,
    overtimePay,
    totalOvertimeHours,
    attendanceDeductions,
    leaveDeductions,
    otherDeductions,
    totalEarnings,
    totalDeductions,
    netSalary,
    month,
    year,
    attendanceDays,
    absentDays,
    leaveDays,
    organizationId: orgId
  };
};

// Helper function to format payroll data for UI
const formatPayrollForUI = (payroll: any) => {
  // Format month as "Month Year" (e.g., "January 2025")
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthIndex = monthNames.indexOf(payroll.month);
  const formattedMonth = monthIndex !== -1 
    ? `${payroll.month} ${payroll.year}` 
    : payroll.month; // Fallback if month is already in correct format

  return {
    id: payroll.id,
    employeeId: payroll.employeeId,
    employeeName: payroll.employeeName,
    department: payroll.department,
    baseSalary: payroll.baseSalary,
    hra: payroll.hra,
    bonus: payroll.bonus,
    otherAllowances: payroll.otherAllowances,
    overtimePay: payroll.overtimePay,
    totalOvertimeHours: payroll.totalOvertimeHours,
    totalEarnings: payroll.totalEarnings,
    deductions: payroll.totalDeductions || (payroll.attendanceDeductions + payroll.leaveDeductions + payroll.otherDeductions),
    totalDeductions: payroll.totalDeductions,
    attendanceDeductions: payroll.attendanceDeductions,
    leaveDeductions: payroll.leaveDeductions,
    otherDeductions: payroll.otherDeductions,
    netSalary: payroll.netSalary,
    month: formattedMonth,
    year: payroll.year,
    status: payroll.status,
    attendanceDays: payroll.attendanceDays,
    absentDays: payroll.absentDays,
    leaveDays: payroll.leaveDays,
  };
};

export const getPayroll = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const filter: any = {};
    if (req.organizationId) filter.organizationId = req.organizationId;
    const payroll = await Payroll.find(filter).sort({ createdAt: -1 });
    const formattedPayroll = payroll.map(formatPayrollForUI);
    res.json({
      success: true,
      data: formattedPayroll,
    });
  } catch (error) {
    console.error('Get Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeePayroll = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const filter: any = { employeeId };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const payroll = await Payroll.find(filter).sort({ createdAt: -1 });
    const formattedPayroll = payroll.map(formatPayrollForUI);
    res.json({
      success: true,
      data: formattedPayroll,
    });
  } catch (error) {
    console.error('Get Employee Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createPayroll = async (req: Request, res: Response<ApiResponse>) => {
  try {
    let payrollData;
    // Convert organizationId to ObjectId for creation
    const orgId = req.organizationId ? new mongoose.Types.ObjectId(req.organizationId) : undefined;
    
    // Check if we have direct data or need to calculate
    if (req.body.baseSalary !== undefined) {
      // Direct data from UI
      payrollData = {
        employeeId: req.body.employeeId,
        employeeName: req.body.employeeName,
        department: req.body.department,
        baseSalary: req.body.baseSalary,
        bonus: req.body.bonus,
        deductions: req.body.deductions,
        totalDeductions: req.body.deductions,
        netSalary: req.body.netSalary,
        month: req.body.month.split(' ')[0], // Extract month name from "Month Year"
        year: parseInt(req.body.month.split(' ')[1]),
        status: req.body.status || 'pending',
        organizationId: orgId,
        // Add default values for required fields in model
        hra: 0,
        otherAllowances: 0,
        attendanceDeductions: 0,
        leaveDeductions: 0,
        otherDeductions: 0,
        totalEarnings: req.body.baseSalary + req.body.bonus,
        attendanceDays: 0,
        absentDays: 0,
        leaveDays: 0,
      };
    } else {
      // Calculate from employee data
      const { employeeId, month, year } = req.body;
      
      if (!employeeId || !month || !year) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: employeeId, month, year',
        });
      }
      payrollData = await calculatePayroll(employeeId, month, year, req.organizationId);
    }

    const newPayroll = await Payroll.create({
      ...payrollData,
      status: req.body.status || 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Payroll record created successfully',
      data: formatPayrollForUI(newPayroll),
    });
  } catch (error) {
    console.error('Create Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const updatePayroll = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    let updateData = req.body;
    
    const payrollFilter: any = { _id: id };
    if (req.organizationId) payrollFilter.organizationId = req.organizationId;
    const existingPayroll = await Payroll.findOne(payrollFilter);
    if (!existingPayroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    // If need to recalculate
    const shouldRecalculate = req.body.recalculate;
    if (shouldRecalculate) {
      const recalculated = await calculatePayroll(
        existingPayroll.employeeId,
        existingPayroll.month,
        existingPayroll.year,
        req.organizationId
      );
      updateData = { ...recalculated, ...updateData };
    } else if (updateData.employeeId && (!updateData.baseSalary || !updateData.hra)) {
      // If only employee changed, recalculate
      const recalculated = await calculatePayroll(
        updateData.employeeId,
        existingPayroll.month,
        existingPayroll.year,
        req.organizationId
      );
      updateData = { ...recalculated, ...updateData };
    }
    
    const updatedPayroll = await Payroll.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Payroll updated successfully',
      data: formatPayrollForUI(updatedPayroll),
    });
  } catch (error) {
    console.error('Update Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const processAllPayroll = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: month, year'
      });
    }

    const employeeFilter: any = {};
    if (req.organizationId) employeeFilter.organizationId = req.organizationId;
    const employees = await Employee.find(employeeFilter);
    const payrollRecords = [];

    for (const employee of employees) {
      // Check if payroll already exists for this employee, month, and year (and organization)
      const payrollFilter: any = {
        employeeId: employee.employeeId,
        month,
        year
      };
      if (req.organizationId) payrollFilter.organizationId = req.organizationId;
      const existingPayroll = await Payroll.findOne(payrollFilter);

      if (!existingPayroll) {
        const payrollData = await calculatePayroll(employee.employeeId, month, year, req.organizationId);
        const newPayroll = await Payroll.create(payrollData);
        payrollRecords.push(formatPayrollForUI(newPayroll));
      } else {
        payrollRecords.push(formatPayrollForUI(existingPayroll));
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payroll processed successfully',
      data: payrollRecords
    });
  } catch (error) {
    console.error('Process All Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

export const deletePayroll = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const deletedPayroll = await Payroll.findByIdAndDelete(id);
    if (!deletedPayroll) {
      return res.status(404).json({ success: false, message: 'Payroll record not found' });
    }
    res.json({
      success: true,
      message: 'Payroll record deleted successfully',
    });
  } catch (error) {
    console.error('Delete Payroll Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};