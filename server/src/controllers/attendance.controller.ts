import { Request, Response } from 'express';
import Attendance from '../models/Attendance.model';
import User from '../models/User.model';
import Leave from '../models/Leave.model';
import Shift from '../models/Shift.model';
import Holiday from '../models/Holiday.model';
import Employee from '../models/Employee.model';
import Organization from '../models/Organization.model';
import { ApiResponse, DashboardStats } from '../types';

// Helper: Get today's date
const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper: Convert HH:MM to minutes
const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper: Calculate duration between two times in minutes
const calculateDuration = (start: string, end: string): number => {
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  return endMinutes - startMinutes;
};

// Helper: Calculate distance between two coordinates (for geo-fencing)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert to meters
};

// Helper: Get current time in HH:MM
const getCurrentTime = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Get all attendance (HR view)
export const getAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date, department, status, startDate, endDate } = req.query;
    const filter: any = {};
    
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (date) filter.date = date;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate) filter.date = { $gte: startDate };
    else if (endDate) filter.date = { $lte: endDate };
    
    if (department) filter.department = department;
    if (status) filter.status = status;
    
    const attendance = await Attendance.find(filter)
      .sort({ date: -1, clockIn: -1 })
      .populate('shiftId');
    
    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get employee's own attendance
export const getEmployeeAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    const filter: any = { employeeId };
    
    if (req.organizationId) filter.organizationId = req.organizationId;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate) filter.date = { $gte: startDate };
    else if (endDate) filter.date = { $lte: endDate };
    
    const attendance = await Attendance.find(filter)
      .sort({ date: -1 })
      .populate('shiftId');
    
    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Employee Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get attendance by specific date
export const getAttendanceByDate = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date } = req.params;
    const filter: any = { date };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const attendance = await Attendance.find(filter)
      .sort({ clockIn: -1 })
      .populate('shiftId');
    
    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Attendance By Date Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get today's attendance for an employee
export const getTodayAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    const today = getTodayDate();
    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const attendance = await Attendance.findOne(filter).populate('shiftId');
    
    res.json({
      success: true,
      data: attendance || null,
    });
  } catch (error) {
    console.error('Get Today Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Clock In
export const clockIn = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { 
      employeeId, 
      method, 
      clockInImage, 
      location, 
      qrCodeData, 
      biometricId, 
      notes
    } = req.body;
    
    // Find employee (from same organization)
    const employeeQuery: any = { employeeId };
    if (req.organizationId) employeeQuery.organizationId = req.organizationId;
    const employee = await User.findOne(employeeQuery);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }
    
    const today = getTodayDate();
    const currentTime = getCurrentTime();
    
    // Check if already clocked in (from same organization)
    const existingAttendanceQuery: any = { employeeId, date: today };
    if (req.organizationId) existingAttendanceQuery.organizationId = req.organizationId;
    const existingAttendance = await Attendance.findOne(existingAttendanceQuery);
    if (existingAttendance && existingAttendance.clockIn) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today',
      });
    }
    
    // Check if it's a holiday
    const holiday = await Holiday.findOne({ date: today, isActive: true, organizationId: req.organizationId });
    if (holiday) {
      // Create holiday attendance record if not exists
      if (!existingAttendance) {
        await Attendance.create({
          employeeId,
          employeeName: employee.name,
          date: today,
          status: 'holiday',
          department: employee.department,
          overtime: 0,
          workingHours: 0,
          totalBreakTime: 0,
          method: 'manual',
          breaks: [],
          notes: holiday.name,
          organizationId: req.organizationId || employee.organizationId
        });
      }
      return res.status(400).json({
        success: false,
        message: `Today is ${holiday.name} - ${holiday.type} holiday`,
      });
    }
    
    // Check if employee is on leave today
    const leaveFilter: any = {
      employeeId,
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    };
    if (req.organizationId) leaveFilter.organizationId = req.organizationId;
    const leave = await Leave.findOne(leaveFilter);
    if (leave && method !== 'remote') {
      // Only block non-remote clock-ins if on leave
      if (!existingAttendance) {
        await Attendance.create({
          employeeId,
          employeeName: employee.name,
          date: today,
          status: 'leave',
          department: employee.department,
          overtime: 0,
          workingHours: 0,
          totalBreakTime: 0,
          method: 'manual',
          breaks: [],
          notes: `${leave.type} leave`,
          organizationId: req.organizationId || employee.organizationId
        });
      }
      return res.status(400).json({
        success: false,
        message: `You are on ${leave.type} leave today - only remote work allowed`,
      });
    }
    
    // Get organization settings
    const organization = await Organization.findById(req.organizationId);
    const orgSettings = organization?.attendanceSettings || {
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateThreshold: '09:15'
    };
    const officeLocation = organization?.officeLocation;
    
    // Get shift for employee or use org settings
    let shift = await Shift.findById(employee.shiftId);
    if (!shift) {
      const shiftFilter: any = { isActive: true, name: 'Morning Shift' };
      if (req.organizationId) shiftFilter.organizationId = req.organizationId;
      shift = await Shift.findOne(shiftFilter);
      if (!shift) {
        // Create default shift if none exists
        shift = await Shift.create({
          name: 'Morning Shift',
          startTime: orgSettings.checkInTime,
          endTime: orgSettings.checkOutTime,
          lateThreshold: orgSettings.lateThreshold,
          halfDayThreshold: 4,
          isActive: true,
          organizationId: req.organizationId
        });
      }
    }
    
    let isPendingApproval = false;
    let approvalStatus: 'approved' | 'rejected' | 'pending' = 'approved';
    
    // Validate geo-fencing if location provided and office location is set
    if (method === 'gps' && location && officeLocation && officeLocation.latitude && officeLocation.longitude) {
      const distance = calculateDistance(
        location.latitude, location.longitude,
        officeLocation.latitude, officeLocation.longitude
      );
      if (distance > officeLocation.radius) {
        // Outside range, require approval
        isPendingApproval = true;
        approvalStatus = 'pending';
      }
    }
    
    // Determine attendance status based on shift or org settings
    const currentMinutes = timeToMinutes(currentTime);
    const lateThresholdMinutes = timeToMinutes(shift?.lateThreshold || orgSettings.lateThreshold);
    const isLate = currentMinutes > lateThresholdMinutes;
    let status: any = isPendingApproval ? 'pending' : (isLate ? 'late' : 'present');
    if (method === 'remote' || employee.department?.toLowerCase().includes('remote')) {
      status = 'remote';
    }
    // If employee is on leave and using remote, set status to remote
    if (leave && method === 'remote') {
      status = 'remote';
    }
    
    // Create or update attendance record
    const attendanceData: any = {
      employeeId,
      employeeName: employee.name,
      date: today,
      clockIn: currentTime,
      clockOut: '',
      status,
      department: employee.department,
      overtime: 0,
      workingHours: 0,
      totalBreakTime: 0,
      method,
      shiftId: shift?._id,
      clockInImage,
      location,
      qrCodeData,
      biometricId,
      notes,
      breaks: existingAttendance?.breaks || [],
      organizationId: req.organizationId || employee.organizationId,
      isPendingApproval,
      approvalStatus
    };
    
    let attendance;
    if (existingAttendance) {
      attendance = await Attendance.findByIdAndUpdate(existingAttendance._id, attendanceData, { new: true });
    } else {
      attendance = await Attendance.create(attendanceData);
    }
    
    res.status(200).json({
      success: true,
      message: isPendingApproval ? 'Clock-in submitted for approval' : 'Clocked in successfully',
      data: attendance,
    });
  } catch (error) {
    console.error('Clock In Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Clock Out
export const clockOut = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId, clockOutImage, notes } = req.body;
    
    const today = getTodayDate();
    const currentTime = getCurrentTime();
    
    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter).populate('shiftId');
    
    if (!attendance || !attendance.clockIn) {
      return res.status(404).json({
        success: false,
        message: 'No clock-in record found for today',
      });
    }
    
    if (attendance.clockOut) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out today',
      });
    }
    
    // Calculate total break time
    let totalBreakTime = 0;
    const updatedBreaks = attendance.breaks.map(br => {
      if (!br.endTime) {
        const duration = calculateDuration(br.startTime, currentTime);
        totalBreakTime += duration;
        return { ...br, endTime: currentTime, duration };
      }
      totalBreakTime += br.duration || 0;
      return br;
    });
    
    // Calculate working hours
    const clockInMinutes = timeToMinutes(attendance.clockIn);
    const clockOutMinutes = timeToMinutes(currentTime);
    const totalMinutes = clockOutMinutes - clockInMinutes - totalBreakTime;
    const workingHours = Math.max(0, totalMinutes / 60);
    
    // Calculate overtime (assuming shift end time is 18:00)
    let overtime = 0;
    if (attendance.shiftId) {
      const shift = attendance.shiftId as any;
      const shiftEndMinutes = timeToMinutes(shift.endTime);
      if (clockOutMinutes > shiftEndMinutes) {
        overtime = (clockOutMinutes - shiftEndMinutes) / 60;
      }
    } else {
      if (clockOutMinutes > timeToMinutes('18:00')) {
        overtime = (clockOutMinutes - timeToMinutes('18:00')) / 60;
      }
    }
    
    // Update status to half-day if working hours are less than threshold
    let status = attendance.status;
    const shift = attendance.shiftId as any;
    const halfDayThreshold = shift?.halfDayThreshold || 4;
    if (workingHours < halfDayThreshold && status !== 'remote') {
      status = 'half-day';
    }
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      {
        clockOut: currentTime,
        clockOutImage,
        overtime,
        workingHours,
        totalBreakTime,
        status,
        breaks: updatedBreaks,
        notes: notes || attendance.notes,
      },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Clock Out Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Start Break
export const startBreak = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId, type } = req.body;
    
    const today = getTodayDate();
    const currentTime = getCurrentTime();
    
    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter);
    
    if (!attendance || !attendance.clockIn) {
      return res.status(404).json({
        success: false,
        message: 'Clock in first to start a break',
      });
    }
    
    // Check if there's already an ongoing break
    const ongoingBreak = attendance.breaks.find(br => !br.endTime);
    if (ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'Already on a break',
      });
    }
    
    attendance.breaks.push({
      type: type || 'other',
      startTime: currentTime
    });
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      { breaks: attendance.breaks },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Break started',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Start Break Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// End Break
export const endBreak = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.body;
    
    const today = getTodayDate();
    const currentTime = getCurrentTime();
    
    const filter: any = { employeeId, date: today };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const attendance = await Attendance.findOne(filter);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No attendance record found for today',
      });
    }
    
    // Find ongoing break
    const breakIndex = attendance.breaks.findIndex(br => !br.endTime);
    if (breakIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'No ongoing break found',
      });
    }
    
    const br = attendance.breaks[breakIndex];
    const duration = calculateDuration(br.startTime, currentTime);
    attendance.breaks[breakIndex] = {
      ...br,
      endTime: currentTime,
      duration
    };
    
    // Update total break time
    const totalBreakTime = attendance.breaks.reduce((sum, b) => sum + (b.duration || 0), 0);
    
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendance._id,
      { 
        breaks: attendance.breaks,
        totalBreakTime
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Break ended',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('End Break Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Dashboard Stats for HR
export const getDashboardStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date } = req.query;
    const targetDate = date as string || getTodayDate();
    
    // Get all employees (from same organization)
    const employeeFilter: any = { role: { $ne: 'hr_manager' } };
    if (req.organizationId) employeeFilter.organizationId = req.organizationId;
    const totalEmployees = await User.countDocuments(employeeFilter);
    
    // Get attendance for target date (from same organization)
    const attendanceFilter: any = { date: targetDate };
    if (req.organizationId) attendanceFilter.organizationId = req.organizationId;
    const attendanceRecords = await Attendance.find(attendanceFilter);
    
    // Get leaves for target date (from same organization)
    const leavesFilter: any = {
      status: 'approved',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    };
    if (req.organizationId) leavesFilter.organizationId = req.organizationId;
    const leaves = await Leave.find(leavesFilter);
    
    const stats: DashboardStats = {
      present: 0,
      absent: 0,
      late: 0,
      onLeave: leaves.length,
      halfDay: 0,
      totalEmployees
    };
    
    attendanceRecords.forEach(record => {
      switch (record.status) {
        case 'present':
        case 'remote':
          stats.present++;
          break;
        case 'late':
          stats.late++;
          break;
        case 'absent':
          stats.absent++;
          break;
        case 'half-day':
          stats.halfDay++;
          break;
      }
    });
    
    // Calculate absent as total minus others
    const accountedFor = stats.present + stats.late + stats.halfDay + stats.onLeave;
    stats.absent = Math.max(0, totalEmployees - accountedFor);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Create manual attendance (HR only)
export const createAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const attendanceData = { 
      ...req.body, 
      method: req.body.method || 'manual', 
      breaks: req.body.breaks || [],
      organizationId: req.organizationId
    };
    const newAttendance = await Attendance.create(attendanceData);
    res.status(201).json({
      success: true,
      message: 'Attendance record created successfully',
      data: newAttendance,
    });
  } catch (error) {
    console.error('Create Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Update attendance
export const updateAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const updatedAttendance = await Attendance.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Update Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Clock-In Distribution (for graph)
export const getClockInDistribution = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { date } = req.query;
    const targetDate = date as string || getTodayDate();
    
    const filter: any = { 
      date: targetDate, 
      clockIn: { $ne: '' }
    };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const attendanceRecords = await Attendance.find(filter);
    
    // Initialize hourly counts for 7:00 to 18:00 (12 hours)
    const hourlyCounts = Array.from({ length: 12 }, (_, i) => ({
      time: `${i + 7}:00`,
      count: 0
    }));
    
    attendanceRecords.forEach(record => {
      if (record.clockIn) {
        const hour = parseInt(record.clockIn.split(':')[0]);
        if (hour >= 7 && hour <= 18) {
          const index = hour - 7;
          hourlyCounts[index].count++;
        }
      }
    });
    
    res.json({
      success: true,
      data: hourlyCounts,
    });
  } catch (error) {
    console.error('Get Clock-In Distribution Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get Attendance Heatmap data
export const getAttendanceHeatmap = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 7); // Last 7 days by default
    
    const start = startDate as string || defaultStart.toISOString().split('T')[0];
    const end = endDate as string || today.toISOString().split('T')[0];
    
    const filter: any = {
      date: { $gte: start, $lte: end },
      clockIn: { $ne: '' }
    };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const attendanceRecords = await Attendance.find(filter);
    
    // Initialize heatmap data
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatmapData: any[] = [];
    
    days.forEach(day => {
      for (let hourIdx = 0; hourIdx < 12; hourIdx++) {
        heatmapData.push({
          day,
          hour: `${hourIdx + 7}:00`,
          value: 0
        });
      }
    });
    
    attendanceRecords.forEach(record => {
      if (record.clockIn) {
        const dateObj = new Date(record.date);
        const dayName = days[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]; // Sunday=6, Monday=0
        const hour = parseInt(record.clockIn.split(':')[0]);
        
        if (hour >= 7 && hour <= 18) {
          const index = days.indexOf(dayName) * 12 + (hour - 7);
          if (index >= 0 && index < heatmapData.length) {
            heatmapData[index].value += Math.floor(Math.random() * 30 + 10); // Simulate intensity
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: heatmapData,
    });
  } catch (error) {
    console.error('Get Attendance Heatmap Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Delete attendance (HR only)
export const deleteAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findByIdAndDelete(id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully',
    });
  } catch (error) {
    console.error('Delete Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get team attendance (for team managers)
export const getTeamAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;
    const { date, status, startDate, endDate } = req.query;

    // Get all employees under this manager (from same organization)
    const employeeFilter: any = { manager: managerName };
    if (req.organizationId) employeeFilter.organizationId = req.organizationId;
    const employees = await Employee.find(employeeFilter);
    const employeeIds = employees.map(emp => emp.employeeId);

    // Build attendance filter
    const filter: any = { employeeId: { $in: employeeIds } };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    if (date) filter.date = date;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    else if (startDate) filter.date = { $gte: startDate };
    else if (endDate) filter.date = { $lte: endDate };
    
    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .sort({ date: -1, clockIn: -1 })
      .populate('shiftId');

    res.json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error('Get Team Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Get pending attendance approvals
export const getPendingApprovals = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const filter: any = { 
      isPendingApproval: true, 
      approvalStatus: 'pending' 
    };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const pendingAttendance = await Attendance.find(filter)
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: pendingAttendance,
    });
  } catch (error) {
    console.error('Get Pending Approvals Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Approve attendance
export const approveAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;
    
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const updatedAttendance = await Attendance.findOneAndUpdate(
      filter,
      {
        isPendingApproval: false,
        approvalStatus: 'approved',
        approvedBy,
        approvedAt: new Date(),
        status: 'present' // Or keep original status? Let's set to present
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Attendance approved successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Approve Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// Reject attendance
export const rejectAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { approvedBy, notes } = req.body;
    
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    
    const updatedAttendance = await Attendance.findOneAndUpdate(
      filter,
      {
        isPendingApproval: false,
        approvalStatus: 'rejected',
        approvedBy,
        approvedAt: new Date(),
        status: 'absent',
        notes: notes || 'Attendance rejected'
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Attendance rejected successfully',
      data: updatedAttendance,
    });
  } catch (error) {
    console.error('Reject Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
