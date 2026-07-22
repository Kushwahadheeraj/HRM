import { Request, Response } from 'express';
import TeamManager from '../models/TeamManager.model';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import Attendance from '../models/Attendance.model';
import Leave from '../models/Leave.model';
import { ApiResponse } from '../types';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../utils/email';

// Helper function to generate unique employeeId
const generateUniqueEmployeeId = async (organizationId?: any): Promise<string> => {
  const filter: any = {};
  if (organizationId) filter.organizationId = organizationId;
  const lastUser = await User.findOne(filter).sort({ createdAt: -1 });
  let employeeId = 'TRX-001';
  
  if (lastUser && lastUser.employeeId) {
    const match = lastUser.employeeId.match(/TRX-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      employeeId = `TRX-${(num + 1).toString().padStart(3, '0')}`;
    }
  }
  
  // Check if the generated employeeId is already in use
  let isUnique = false;
  let attempt = 0;
  while (!isUnique && attempt < 1000) {
    const userFilter: any = { employeeId };
    if (organizationId) userFilter.organizationId = organizationId;
    const existingUser = await User.findOne(userFilter);
    if (!existingUser) {
      isUnique = true;
    } else {
      // If duplicate, increment the number
      const match = employeeId.match(/TRX-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        employeeId = `TRX-${(num + 1).toString().padStart(3, '0')}`;
      }
      attempt++;
    }
  }
  
  return employeeId;
};

export const getTeamManagers = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const filter: any = {};
    if (req.organizationId) filter.organizationId = req.organizationId;
    const teamManagers = await TeamManager.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: teamManagers,
    });
  } catch (error) {
    // console.error('Get Team Managers Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamManager = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const teamManager = await TeamManager.findOne(filter);

    if (!teamManager) {
      return res.status(404).json({
        success: false,
        message: 'Team Manager not found',
      });
    }

    res.json({
      success: true,
      data: teamManager,
    });
  } catch (error) {
    // console.error('Get Team Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeesByManager = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;
    const filter: any = { manager: managerName };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    // console.error('Get Employees by Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createTeamManager = async (req: Request, res: Response<ApiResponse>) => {
  try {
    // console.log('Received request body:', req.body);
    const { password, ...teamManagerData } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'email', 'department', 'joinDate', 'phone', 'password'];
    const missingFields = requiredFields.filter(field => {
      if (field === 'password') return !password;
      return !teamManagerData[field as keyof typeof teamManagerData];
    });
    
    if (missingFields.length > 0) {
      // console.log('Missing required fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Check if team manager email already exists
    const existingFilter: any = { email: teamManagerData.email };
    if (req.organizationId) existingFilter.organizationId = req.organizationId;
    const existingTeamManager = await TeamManager.findOne(existingFilter);
    if (existingTeamManager) {
      // console.log('Email already exists:', teamManagerData.email);
      return res.status(400).json({
        success: false,
        message: 'Team Manager with this email already exists',
      });
    }

    // Get HR info (logged in user)
    const hrUserId = req.headers['x-user-id'] as string;
    const hrUser = await User.findById(hrUserId);
    
    if (!hrUser) {
      return res.status(400).json({
        success: false,
        message: 'HR not found',
      });
    }

    // Generate unique employeeId
    const newEmployeeId = await generateUniqueEmployeeId(req.organizationId);

    const newTeamManager = await TeamManager.create({
      ...teamManagerData,
      employeeId: newEmployeeId,
      organizationId: req.organizationId,
    });
    // console.log('Created TeamManager document:', newTeamManager);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create corresponding user for login
    const newUser = await User.create({
      name: teamManagerData.name,
      email: teamManagerData.email,
      password: hashedPassword, // Use hashed password
      role: 'team_manager',
      roleLabel: 'Team Manager',
      department: teamManagerData.department,
      avatar: teamManagerData.avatar,
      phone: teamManagerData.phone,
      employeeId: newEmployeeId,
      organizationId: req.organizationId,
    });

    // Create corresponding Employee record
    const newEmployee = await Employee.create({
      name: teamManagerData.name,
      email: teamManagerData.email,
      role: 'Team Manager',
      department: teamManagerData.department,
      avatar: teamManagerData.avatar || '',
      status: teamManagerData.status || 'active',
      joinDate: teamManagerData.joinDate,
      phone: teamManagerData.phone,
      employeeId: newEmployeeId,
      salary: 0,
      performance: 0,
      organizationId: req.organizationId,
    });
    // console.log('Created User and Employee documents');

    // Send welcome email
    sendWelcomeEmail(
      teamManagerData.email, 
      teamManagerData.name, 
      password, 
      'Team Manager',
      hrUser.name,
      hrUser.email
    ).catch(err => {
      // console.error('Error sending email:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Team Manager created successfully',
      data: newTeamManager,
    });
  } catch (error) {
    // console.error('Create Team Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateTeamManager = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { password, ...teamManagerData } = req.body;

    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const updatedTeamManager = await TeamManager.findOneAndUpdate(filter, teamManagerData, {
      new: true,
      runValidators: true,
    });

    if (!updatedTeamManager) {
      return res.status(404).json({
        success: false,
        message: 'Team Manager not found',
      });
    }

    // Prepare update object
    const userUpdateData: any = {
      name: teamManagerData.name,
      email: teamManagerData.email,
      department: teamManagerData.department,
      avatar: teamManagerData.avatar,
      phone: teamManagerData.phone,
    };

    // Hash password if provided
    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
    }

    // Update corresponding user
    const userFilter: any = { employeeId: updatedTeamManager.employeeId };
    if (req.organizationId) userFilter.organizationId = req.organizationId;
    await User.findOneAndUpdate(
      userFilter,
      userUpdateData
    );

    // Update corresponding Employee
    const empFilter: any = { employeeId: updatedTeamManager.employeeId };
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    await Employee.findOneAndUpdate(
      empFilter,
      {
        name: teamManagerData.name,
        email: teamManagerData.email,
        department: teamManagerData.department,
        avatar: teamManagerData.avatar,
        status: teamManagerData.status,
        phone: teamManagerData.phone
      }
    );

    res.json({
      success: true,
      message: 'Team Manager updated successfully',
      data: updatedTeamManager,
    });
  } catch (error) {
    // console.error('Update Team Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteTeamManager = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const filter: any = { _id: id };
    if (req.organizationId) filter.organizationId = req.organizationId;
    const deletedTeamManager = await TeamManager.findOneAndDelete(filter);

    if (!deletedTeamManager) {
      return res.status(404).json({
        success: false,
        message: 'Team Manager not found',
      });
    }

    // Delete corresponding user and employee
    const userFilter: any = { employeeId: deletedTeamManager.employeeId };
    if (req.organizationId) userFilter.organizationId = req.organizationId;
    await User.findOneAndDelete(userFilter);
    const empFilter: any = { employeeId: deletedTeamManager.employeeId };
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    await Employee.findOneAndDelete(empFilter);

    res.json({
      success: true,
      message: 'Team Manager deleted successfully',
    });
  } catch (error) {
    // console.error('Delete Team Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamManagerDashboardStats = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;

    // Get all employees under this manager
    const empFilter: any = { manager: managerName };
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    const employees = await Employee.find(empFilter);
    const employeeIds = employees.map(e => e.employeeId);

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Get today's attendance for team
    const attFilter: any = { employeeId: { $in: employeeIds }, date: today };
    if (req.organizationId) attFilter.organizationId = req.organizationId;
    const todayAttendance = await Attendance.find(attFilter);

    // Get pending leaves for team
    const leaveFilter: any = { employeeId: { $in: employeeIds }, status: 'pending' };
    if (req.organizationId) leaveFilter.organizationId = req.organizationId;
    const pendingLeaves = await Leave.find(leaveFilter);

    // Calculate average performance
    const avgPerformance = employees.length > 0 
      ? Math.round(employees.reduce((sum, e) => sum + e.performance, 0) / employees.length) 
      : 0;

    // Calculate present today count (present, late, remote, half-day)
    const presentToday = todayAttendance.filter(r => 
      r.status === 'present' || r.status === 'late' || r.status === 'remote' || r.status === 'half-day'
    ).length;

    res.json({
      success: true,
      data: {
        teamSize: employees.length,
        presentToday,
        avgPerformance,
        pendingLeaves: pendingLeaves.length,
        employees
      }
    });
  } catch (error) {
    // console.error('Get Team Manager Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getTeamWeeklyAttendance = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;

    // Get all employees under this manager
    const empFilter: any = { manager: managerName };
    if (req.organizationId) empFilter.organizationId = req.organizationId;
    const employees = await Employee.find(empFilter);
    const employeeIds = employees.map(e => e.employeeId);

    // Get dates for the last 7 days (Mon-Fri)
    const dates: string[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    const today = new Date();
    
    // Find the most recent Monday
    const day = today.getDay(); // 0 = Sunday, 1 = Monday...
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust to last Monday
    const monday = new Date(today.setDate(diff));
    
    // Get Mon-Fri dates
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Get attendance for these dates
    const attFilter: any = { 
      employeeId: { $in: employeeIds }, 
      date: { $in: dates } 
    };
    if (req.organizationId) attFilter.organizationId = req.organizationId;
    const attendanceRecords = await Attendance.find(attFilter);

    // Aggregate data by day
    const weeklyData = dayNames.map((dayName, i) => {
      const date = dates[i];
      const dayRecords = attendanceRecords.filter(r => r.date === date);
      const present = dayRecords.filter(r => 
        r.status === 'present' || r.status === 'remote' || r.status === 'half-day'
      ).length;
      const late = dayRecords.filter(r => r.status === 'late').length;
      const absent = employees.length - present - late - dayRecords.filter(r => r.status === 'leave' || r.status === 'holiday').length;

      return {
        day: dayName,
        date,
        present: Math.max(0, present),
        late,
        absent: Math.max(0, absent)
      };
    });

    res.json({
      success: true,
      data: weeklyData
    });
  } catch (error) {
    // console.error('Get Team Weekly Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
