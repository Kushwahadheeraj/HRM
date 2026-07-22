import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import Attendance from '../models/Attendance.model';
import Leave from '../models/Leave.model';
import Payroll from '../models/Payroll.model';
import { ApiResponse } from '../types';

export const getDashboardStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const empFilter: any = {};
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    const totalEmployees = await Employee.countDocuments(empFilter);
    const activeEmployees = await Employee.countDocuments({ ...empFilter, status: 'active' });
    const onLeaveEmployees = await Employee.countDocuments({ ...empFilter, status: 'on-leave' });
    
    // Get attendance rate
    const attFilter: any = {};
    if (req.organizationId) attFilter.organizationId = req.organizationId;
    const attendanceRecords = await Attendance.find(attFilter);
    const presentCount = attendanceRecords.filter(r => 
      ['present', 'late', 'remote', 'half-day'].includes(r.status)
    ).length;
    const attendanceRate = attendanceRecords.length > 0 
      ? Math.round((presentCount / attendanceRecords.length) * 100) 
      : 0;

    const employees = await Employee.find(empFilter);
    const averagePerformance = employees.length > 0 
      ? Math.round(employees.reduce((sum, emp) => sum + emp.performance, 0) / employees.length) 
      : 0;

    res.json({
      success: true,
      data: {
        avgAttendance: `${attendanceRate}%`,
        avgAttendanceChange: '+2.1%',
        employeeSatisfaction: '87%',
        employeeSatisfactionChange: '+5%',
        productivityIndex: 82.5,
        productivityChange: '-1.2',
        retentionRate: '97.9%',
        retentionChange: '+0.5%',
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        averagePerformance,
      },
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getDepartmentStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const empFilter: any = {};
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    const employees = await Employee.find(empFilter);
    const attFilter: any = {};
    if (req.organizationId) attFilter.organizationId = req.organizationId;
    const allAttendance = await Attendance.find(attFilter);
    const departments: any = {};

    employees.forEach(emp => {
      if (!departments[emp.department]) {
        departments[emp.department] = {
          name: emp.department,
          employees: 0,
          attendance: 0,
          performance: 0,
          attendanceRecords: [],
        };
      }
      departments[emp.department].employees++;
      departments[emp.department].performance += emp.performance;
    });

    // Add attendance records to departments
    allAttendance.forEach(record => {
      if (departments[record.department]) {
        departments[record.department].attendanceRecords.push(record);
      }
    });

    Object.keys(departments).forEach(dept => {
      const deptData = departments[dept];
      // Calculate average performance
      deptData.performance = Math.round(deptData.performance / deptData.employees);
      
      // Calculate attendance rate for department
      if (deptData.attendanceRecords.length > 0) {
        const presentCount = deptData.attendanceRecords.filter((r: any) => 
          ['present', 'late', 'remote', 'half-day'].includes(r.status)
        ).length;
        deptData.attendance = Math.round((presentCount / deptData.attendanceRecords.length) * 100);
      } else {
        deptData.attendance = 90; // Default if no records
      }
      
      delete deptData.attendanceRecords;
    });

    res.json({
      success: true,
      data: Object.values(departments),
    });
  } catch (error) {
    console.error('Get Department Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getAttendanceTrends = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = fullMonthNames[date.getMonth()];
      const year = date.getFullYear();
      last6Months.push({ month, year, monthAbbr: monthNames[date.getMonth()] });
    }

    const trends = await Promise.all(last6Months.map(async (period) => {
      // Get all dates for the month
      const startDate = new Date(period.year, fullMonthNames.indexOf(period.month), 1).toISOString().split('T')[0];
      const endDate = new Date(period.year, fullMonthNames.indexOf(period.month) + 1, 0).toISOString().split('T')[0];
      
      const filter: any = { date: { $gte: startDate, $lte: endDate } };
      if (req.organizationId) filter.organizationId = req.organizationId;
      const records = await Attendance.find(filter);
      const total = records.length;
      const present = records.filter(r => ['present', 'late', 'remote'].includes(r.status)).length;
      
      let rate = 93; // Default if no data
      if (total > 0) {
        rate = Math.round((present / total) * 100);
      }
      
      return {
        month: period.monthAbbr,
        rate,
      };
    }));

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    console.error('Get Attendance Trends Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getRadarData = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const empFilter: any = {};
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    const employees = await Employee.find(empFilter);
    const averagePerformance = employees.length > 0 
      ? Math.round(employees.reduce((sum, emp) => sum + emp.performance, 0) / employees.length) 
      : 0;
    
    const attFilter: any = {};
    if (req.organizationId) attFilter.organizationId = req.organizationId;
    const attendanceRecords = await Attendance.find(attFilter);
    const presentCount = attendanceRecords.filter(r => 
      ['present', 'late', 'remote', 'half-day'].includes(r.status)
    ).length;
    const attendanceRate = attendanceRecords.length > 0 
      ? Math.round((presentCount / attendanceRecords.length) * 100) 
      : 0;

    const radarData = [
      { metric: 'Attendance', A: attendanceRate, B: attendanceRate - 5 },
      { metric: 'Performance', A: averagePerformance, B: averagePerformance - 6 },
      { metric: 'Engagement', A: 85, B: 79 }, // Simulated
      { metric: 'Productivity', A: 82, B: 85 }, // Simulated
      { metric: 'Satisfaction', A: 87, B: 80 }, // Simulated
      { metric: 'Retention', A: 98, B: 92 }, // Simulated
    ];

    res.json({
      success: true,
      data: radarData,
    });
  } catch (error) {
    console.error('Get Radar Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getRevenueData = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      last6Months.push(monthNames[date.getMonth()]);
    }

    const revenueData = last6Months.map((month, i) => ({
      month,
      revenue: 4200 + i * 300 + Math.floor(Math.random() * 200),
      cost: 3100 + i * 100 + Math.floor(Math.random() * 100),
    }));

    res.json({
      success: true,
      data: revenueData,
    });
  } catch (error) {
    console.error('Get Revenue Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getProductivityData = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const productivityData = [
      { hour: '6AM', value: 15 },
      { hour: '8AM', value: 45 },
      { hour: '9AM', value: 78 },
      { hour: '10AM', value: 92 },
      { hour: '11AM', value: 88 },
      { hour: '12PM', value: 65 },
      { hour: '1PM', value: 55 },
      { hour: '2PM', value: 82 },
      { hour: '3PM', value: 90 },
      { hour: '4PM', value: 85 },
      { hour: '5PM', value: 70 },
      { hour: '6PM', value: 40 },
    ];

    res.json({
      success: true,
      data: productivityData,
    });
  } catch (error) {
    console.error('Get Productivity Data Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
