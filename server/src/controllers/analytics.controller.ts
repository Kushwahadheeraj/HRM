import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import Attendance from '../models/Attendance.model';
import Leave from '../models/Leave.model';
import Payroll from '../models/Payroll.model';
import Performance from '../models/Performance.model';
import { ApiResponse } from '../types';

const POSITIVE_ATTENDANCE_STATUSES = ['present', 'late', 'remote', 'half-day'];
const ACTIVE_EMPLOYEE_STATUSES = ['active', 'remote', 'on-leave'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const KPI_WINDOW_DAYS = 30;

type DayWindow = {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
};

type AnalyticsMetrics = {
  attendanceRate: number;
  performanceScore: number;
  leaveApprovalRate: number;
  workingHoursScore: number;
  satisfactionScore: number;
  productivityIndex: number;
  retentionRate: number;
  engagementScore: number;
};

const buildOrganizationFilter = (organizationId: Request['organizationId']) => {
  const filter: any = {};
  if (organizationId) {
    filter.organizationId = organizationId;
  }
  return filter;
};

const toDateString = (date: Date) => date.toISOString().split('T')[0];

const roundValue = (value: number, digits = 1) => Number(value.toFixed(digits));

const clampPercentage = (value: number) => Math.max(0, Math.min(100, roundValue(value, 1)));

const average = (values: number[], digits = 1) => {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return roundValue(total / values.length, digits);
};

const percentage = (part: number, total: number, digits = 1) => {
  if (total <= 0) {
    return 0;
  }

  return roundValue((part / total) * 100, digits);
};

const getDayWindow = (days: number, offsetDays = 0): DayWindow => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetDays);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);

  return {
    start,
    end,
    startDate: toDateString(start),
    endDate: toDateString(end),
  };
};

const getTrailingMonths = (count: number) => {
  const months: Array<{
    key: string;
    monthAbbr: string;
    fullMonth: string;
    year: number;
    startDate: string;
    endDate: string;
  }> = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - i);

    const year = date.getFullYear();
    const monthIndex = date.getMonth();
    const monthStart = new Date(year, monthIndex, 1);
    const monthEnd = new Date(year, monthIndex + 1, 0);

    months.push({
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      monthAbbr: MONTH_NAMES[monthIndex],
      fullMonth: FULL_MONTH_NAMES[monthIndex],
      year,
      startDate: toDateString(monthStart),
      endDate: toDateString(monthEnd),
    });
  }

  return months;
};

const isCreatedWithinWindow = (value: Date | string | undefined, window: DayWindow) => {
  if (!value) {
    return false;
  }

  const createdAt = new Date(value);
  return !Number.isNaN(createdAt.getTime()) && createdAt >= window.start && createdAt <= window.end;
};

const formatPercentage = (value: number) => `${roundValue(value, 1)}%`;

const formatSignedChange = (current: number, previous: number, suffix = '', digits = 1) => {
  const diff = roundValue(current - previous, digits);
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff}${suffix}`;
};

const parseJoinDate = (joinDate: string) => {
  const parsed = new Date(joinDate);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const calculateAttendanceRate = (records: Array<{ status: string }>) => {
  const presentCount = records.filter((record) => POSITIVE_ATTENDANCE_STATUSES.includes(record.status)).length;
  return percentage(presentCount, records.length);
};

const calculatePerformanceScore = (
  performanceRecords: Array<{ overallScore: number }>,
  employees: Array<{ performance: number }>
) => {
  if (performanceRecords.length > 0) {
    return average(performanceRecords.map((record) => record.overallScore));
  }

  return average(employees.map((employee) => employee.performance));
};

const calculateLeaveApprovalRate = (leaveRecords: Array<{ status: string }>) => {
  const approvedLeaves = leaveRecords.filter((leave) => leave.status === 'approved').length;
  return percentage(approvedLeaves, leaveRecords.length);
};

const calculateWorkingHoursScore = (attendanceRecords: Array<{ workingHours: number }>) => {
  if (attendanceRecords.length === 0) {
    return 0;
  }

  const normalizedHours = attendanceRecords.map((record) => {
    const workingHours = Number(record.workingHours) || 0;
    return Math.min((workingHours / 8) * 100, 100);
  });

  return clampPercentage(average(normalizedHours));
};

const calculateRetentionRate = (
  employees: Array<{ joinDate: string; status: string }>,
  referenceDate: Date
) => {
  const eligibleEmployees = employees.filter((employee) => {
    const joinDate = parseJoinDate(employee.joinDate);
    return joinDate ? joinDate <= referenceDate : true;
  });

  const cohort = eligibleEmployees.length > 0 ? eligibleEmployees : employees;
  const retainedEmployees = cohort.filter((employee) => ACTIVE_EMPLOYEE_STATUSES.includes(employee.status)).length;

  return percentage(retainedEmployees, cohort.length);
};

const buildPeriodMetrics = ({
  employees,
  attendanceRecords,
  leaveRecords,
  performanceRecords,
  referenceDate,
}: {
  employees: Array<{ performance: number; joinDate: string; status: string }>;
  attendanceRecords: Array<{ status: string; workingHours: number }>;
  leaveRecords: Array<{ status: string }>;
  performanceRecords: Array<{ overallScore: number }>;
  referenceDate: Date;
}): AnalyticsMetrics => {
  const attendanceRate = calculateAttendanceRate(attendanceRecords);
  const performanceScore = calculatePerformanceScore(performanceRecords, employees);
  const leaveApprovalRate = calculateLeaveApprovalRate(leaveRecords);
  const workingHoursScore = calculateWorkingHoursScore(attendanceRecords);

  const satisfactionInputs = [performanceScore, attendanceRate];
  const engagementInputs = [attendanceRate, workingHoursScore];

  if (leaveRecords.length > 0) {
    satisfactionInputs.push(leaveApprovalRate);
    engagementInputs.push(leaveApprovalRate);
  }

  return {
    attendanceRate,
    performanceScore,
    leaveApprovalRate,
    workingHoursScore,
    satisfactionScore: average(satisfactionInputs),
    productivityIndex: average([performanceScore, attendanceRate, workingHoursScore]),
    retentionRate: calculateRetentionRate(employees, referenceDate),
    engagementScore: average(engagementInputs),
  };
};

const buildPayrollMonthKey = (month: string, year: number) => {
  const fullMonthIndex = FULL_MONTH_NAMES.indexOf(month);
  const monthIndex = fullMonthIndex >= 0 ? fullMonthIndex : MONTH_NAMES.indexOf(month);

  if (monthIndex < 0) {
    return null;
  }

  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
};

export const getDashboardStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const organizationFilter = buildOrganizationFilter(req.organizationId);
    const employeeFilter = { ...organizationFilter };
    const currentWindow = getDayWindow(KPI_WINDOW_DAYS);
    const previousWindow = getDayWindow(KPI_WINDOW_DAYS, KPI_WINDOW_DAYS);

    const attendanceFilter = {
      ...organizationFilter,
      date: { $gte: previousWindow.startDate, $lte: currentWindow.endDate },
    };
    const leaveFilter = {
      ...organizationFilter,
      createdAt: { $gte: previousWindow.start, $lte: currentWindow.end },
    };
    const performanceFilter = {
      ...organizationFilter,
      createdAt: { $gte: previousWindow.start, $lte: currentWindow.end },
    };

    const [employees, attendanceRecords, leaveRecords, performanceRecords] = await Promise.all([
      Employee.find(employeeFilter).lean(),
      Attendance.find(attendanceFilter).lean(),
      Leave.find(leaveFilter).lean(),
      Performance.find(performanceFilter).lean(),
    ]);

    const currentAttendance = attendanceRecords.filter((record) =>
      record.date >= currentWindow.startDate && record.date <= currentWindow.endDate
    );
    const previousAttendance = attendanceRecords.filter((record) =>
      record.date >= previousWindow.startDate && record.date <= previousWindow.endDate
    );

    const currentLeaves = leaveRecords.filter((record) => isCreatedWithinWindow(record.createdAt, currentWindow));
    const previousLeaves = leaveRecords.filter((record) => isCreatedWithinWindow(record.createdAt, previousWindow));

    const currentPerformance = performanceRecords.filter((record) => isCreatedWithinWindow(record.createdAt, currentWindow));
    const previousPerformance = performanceRecords.filter((record) => isCreatedWithinWindow(record.createdAt, previousWindow));

    const currentMetrics = buildPeriodMetrics({
      employees,
      attendanceRecords: currentAttendance,
      leaveRecords: currentLeaves,
      performanceRecords: currentPerformance,
      referenceDate: currentWindow.end,
    });

    const previousMetrics = buildPeriodMetrics({
      employees,
      attendanceRecords: previousAttendance,
      leaveRecords: previousLeaves,
      performanceRecords: previousPerformance,
      referenceDate: previousWindow.end,
    });

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((employee) => employee.status === 'active').length;
    const onLeaveEmployees = employees.filter((employee) => employee.status === 'on-leave').length;

    res.json({
      success: true,
      data: {
        avgAttendance: formatPercentage(currentMetrics.attendanceRate),
        avgAttendanceChange: formatSignedChange(currentMetrics.attendanceRate, previousMetrics.attendanceRate, '%'),
        employeeSatisfaction: formatPercentage(currentMetrics.satisfactionScore),
        employeeSatisfactionChange: formatSignedChange(currentMetrics.satisfactionScore, previousMetrics.satisfactionScore, '%'),
        productivityIndex: currentMetrics.productivityIndex,
        productivityChange: formatSignedChange(currentMetrics.productivityIndex, previousMetrics.productivityIndex),
        retentionRate: formatPercentage(currentMetrics.retentionRate),
        retentionChange: formatSignedChange(currentMetrics.retentionRate, previousMetrics.retentionRate, '%'),
        totalEmployees,
        activeEmployees,
        onLeaveEmployees,
        averagePerformance: currentMetrics.performanceScore,
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
    const organizationFilter = buildOrganizationFilter(req.organizationId);

    const [employees, allAttendance] = await Promise.all([
      Employee.find(organizationFilter).lean(),
      Attendance.find(organizationFilter).lean(),
    ]);

    const departments: Record<string, {
      name: string;
      employees: number;
      attendance: number;
      performance: number;
      attendanceRecords: Array<{ status: string }>;
    }> = {};

    employees.forEach((employee) => {
      if (!departments[employee.department]) {
        departments[employee.department] = {
          name: employee.department,
          employees: 0,
          attendance: 0,
          performance: 0,
          attendanceRecords: [],
        };
      }

      departments[employee.department].employees += 1;
      departments[employee.department].performance += employee.performance;
    });

    allAttendance.forEach((record) => {
      if (departments[record.department]) {
        departments[record.department].attendanceRecords.push(record);
      }
    });

    const departmentData = Object.values(departments).map((department) => ({
      name: department.name,
      employees: department.employees,
      attendance: calculateAttendanceRate(department.attendanceRecords),
      performance: department.employees > 0 ? roundValue(department.performance / department.employees) : 0,
    }));

    res.json({
      success: true,
      data: departmentData,
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
    const organizationFilter = buildOrganizationFilter(req.organizationId);
    const months = getTrailingMonths(6);
    const rangeFilter = {
      ...organizationFilter,
      date: { $gte: months[0].startDate, $lte: months[months.length - 1].endDate },
    };

    const attendanceRecords = await Attendance.find(rangeFilter).lean();
    const monthlyBuckets = new Map<string, Array<{ status: string }>>();

    months.forEach((month) => {
      monthlyBuckets.set(month.key, []);
    });

    attendanceRecords.forEach((record) => {
      const recordDate = new Date(record.date);
      if (Number.isNaN(recordDate.getTime())) {
        return;
      }

      const key = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyBuckets.has(key)) {
        monthlyBuckets.get(key)!.push(record);
      }
    });

    const trends = months.map((month) => ({
      month: month.monthAbbr,
      rate: calculateAttendanceRate(monthlyBuckets.get(month.key) || []),
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
    const organizationFilter = buildOrganizationFilter(req.organizationId);
    const currentWindow = getDayWindow(KPI_WINDOW_DAYS);
    const previousWindow = getDayWindow(KPI_WINDOW_DAYS, KPI_WINDOW_DAYS);

    const attendanceFilter = {
      ...organizationFilter,
      date: { $gte: previousWindow.startDate, $lte: currentWindow.endDate },
    };
    const leaveFilter = {
      ...organizationFilter,
      createdAt: { $gte: previousWindow.start, $lte: currentWindow.end },
    };
    const performanceFilter = {
      ...organizationFilter,
      createdAt: { $gte: previousWindow.start, $lte: currentWindow.end },
    };

    const [employees, attendanceRecords, leaveRecords, performanceRecords] = await Promise.all([
      Employee.find(organizationFilter).lean(),
      Attendance.find(attendanceFilter).lean(),
      Leave.find(leaveFilter).lean(),
      Performance.find(performanceFilter).lean(),
    ]);

    const currentMetrics = buildPeriodMetrics({
      employees,
      attendanceRecords: attendanceRecords.filter((record) =>
        record.date >= currentWindow.startDate && record.date <= currentWindow.endDate
      ),
      leaveRecords: leaveRecords.filter((record) => isCreatedWithinWindow(record.createdAt, currentWindow)),
      performanceRecords: performanceRecords.filter((record) => isCreatedWithinWindow(record.createdAt, currentWindow)),
      referenceDate: currentWindow.end,
    });

    const previousMetrics = buildPeriodMetrics({
      employees,
      attendanceRecords: attendanceRecords.filter((record) =>
        record.date >= previousWindow.startDate && record.date <= previousWindow.endDate
      ),
      leaveRecords: leaveRecords.filter((record) => isCreatedWithinWindow(record.createdAt, previousWindow)),
      performanceRecords: performanceRecords.filter((record) => isCreatedWithinWindow(record.createdAt, previousWindow)),
      referenceDate: previousWindow.end,
    });

    const radarData = [
      { metric: 'Attendance', A: currentMetrics.attendanceRate, B: previousMetrics.attendanceRate },
      { metric: 'Performance', A: currentMetrics.performanceScore, B: previousMetrics.performanceScore },
      { metric: 'Engagement', A: currentMetrics.engagementScore, B: previousMetrics.engagementScore },
      { metric: 'Productivity', A: currentMetrics.productivityIndex, B: previousMetrics.productivityIndex },
      { metric: 'Satisfaction', A: currentMetrics.satisfactionScore, B: previousMetrics.satisfactionScore },
      { metric: 'Retention', A: currentMetrics.retentionRate, B: previousMetrics.retentionRate },
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
    const organizationFilter = buildOrganizationFilter(req.organizationId);
    const months = getTrailingMonths(6);
    const payrollFilter = {
      ...organizationFilter,
      $or: months.map((month) => ({ month: month.fullMonth, year: month.year })),
    };

    const payrollRecords = await Payroll.find(payrollFilter).lean();
    const totalsByMonth = new Map<string, { grossPayroll: number; netPayroll: number }>();

    months.forEach((month) => {
      totalsByMonth.set(month.key, { grossPayroll: 0, netPayroll: 0 });
    });

    payrollRecords.forEach((record) => {
      const key = buildPayrollMonthKey(record.month, record.year);
      if (!key || !totalsByMonth.has(key)) {
        return;
      }

      const totals = totalsByMonth.get(key)!;
      totals.grossPayroll += Number(record.totalEarnings) || 0;
      totals.netPayroll += Number(record.netSalary) || 0;
    });

    const revenueData = months.map((month) => {
      const totals = totalsByMonth.get(month.key) || { grossPayroll: 0, netPayroll: 0 };
      return {
        month: month.monthAbbr,
        grossPayroll: roundValue(totals.grossPayroll / 1000),
        netPayroll: roundValue(totals.netPayroll / 1000),
      };
    });

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
    const organizationFilter = buildOrganizationFilter(req.organizationId);
    const last90Days = getDayWindow(90);
    const filter = {
      ...organizationFilter,
      date: { $gte: last90Days.startDate, $lte: last90Days.endDate },
      clockIn: { $ne: '' },
    };

    const attendanceRecords = await Attendance.find(filter).lean();
    const hourlyBuckets = Array.from({ length: 13 }, (_, index) => ({
      hour: `${((index + 6) % 12) || 12}${index + 6 < 12 ? 'AM' : 'PM'}`,
      count: 0,
    }));

    attendanceRecords.forEach((record) => {
      const hour = Number(record.clockIn.split(':')[0]);
      if (Number.isNaN(hour) || hour < 6 || hour > 18) {
        return;
      }

      hourlyBuckets[hour - 6].count += 1;
    });

    const maxCount = Math.max(...hourlyBuckets.map((bucket) => bucket.count), 0);
    const productivityData = hourlyBuckets.map((bucket) => ({
      hour: bucket.hour,
      value: maxCount > 0 ? roundValue((bucket.count / maxCount) * 100) : 0,
    }));

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
