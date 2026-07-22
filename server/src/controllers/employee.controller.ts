import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import User from '../models/User.model';
import Organization from '../models/Organization.model';
import Pricing from '../models/Pricing.model';
import { ApiResponse } from '../types';
import * as xlsx from 'xlsx';
import bcrypt from 'bcrypt';
import { sendWelcomeEmail } from '../utils/email';
import { sendNewEmployeeNotification } from '../utils/slack';

// Helper function to get employee limit for organization
const getEmployeeLimit = async (organizationId: string): Promise<{ limit: number; current: number }> => {
  // Get organization
  const org = await Organization.findById(organizationId);
  if (!org) {
    return { limit: 0, current: 0 };
  }

  // Determine max allowed employees
  let maxEmployees = 0;
  
  if (!org.isPaid) {
    // Free trial: 25 employees (admin doesn't count)
    maxEmployees = 25;
  } else {
    // Paid plan: get limit from pricing
    const pricing = await Pricing.findOne({ plan: org.plan || 'Basic' });
    if (pricing) {
      maxEmployees = pricing.employeeLimit;
    } else {
      // Fallback
      maxEmployees = org.plan === 'Enterprise' ? -1 : org.plan === 'Pro' ? 500 : 50;
    }
  }

  // Count current employees (exclude admin? Well, we'll count all employees)
  const currentEmployees = await Employee.countDocuments({ organizationId });
  
  return {
    limit: maxEmployees, // -1 = unlimited
    current: currentEmployees
  };
};

interface ExcelRow {
  name?: string;
  Name?: string;
  'Full Name'?: string;
  email?: string;
  Email?: string;
  role?: string;
  Role?: string;
  JobTitle?: string;
  department?: string;
  Department?: string;
  avatar?: string;
  Avatar?: string;
  status?: string;
  Status?: string;
  joinDate?: string;
  JoinDate?: string;
  'Join Date'?: string;
  phone?: string;
  Phone?: string;
  'Phone Number'?: string;
  employeeId?: string;
  EmployeeId?: string;
  'Employee ID'?: string;
  salary?: number | string;
  Salary?: number | string;
  performance?: number | string;
  Performance?: number | string;
  manager?: string;
  Manager?: string;
  password?: string;
  Password?: string;
}

// Helper function to map role to user role and role label
const getRoleDetails = (role: string) => {
  // SUPER IMPORTANT: Check for HR Manager MUST BE FIRST!
  if (role.toLowerCase().includes('hr')) {
    return { userRole: 'hr_manager', roleLabel: role.includes('HR Manager') ? 'HR Manager' : role };
  }

  const roleMap: Record<string, { userRole: string; roleLabel: string; }> = {
    'HR Manager': { userRole: 'hr_manager', roleLabel: 'HR Manager' },
    'Senior Engineer': { userRole: 'employee', roleLabel: 'Senior Engineer' },
    'Product Manager': { userRole: 'team_manager', roleLabel: 'Product Manager' },
    'Team Manager': { userRole: 'team_manager', roleLabel: 'Team Manager' },
    'UX Designer': { userRole: 'employee', roleLabel: 'UX Designer' },
    'DevOps Lead': { userRole: 'team_manager', roleLabel: 'DevOps Lead' },
    'Data Scientist': { userRole: 'employee', roleLabel: 'Data Scientist' },
    'Frontend Developer': { userRole: 'employee', roleLabel: 'Frontend Developer' },
    'Marketing Director': { userRole: 'employee', roleLabel: 'Marketing Director' },
    'Finance Analyst': { userRole: 'employee', roleLabel: 'Finance Analyst' },
    'Backend Developer': { userRole: 'employee', roleLabel: 'Backend Developer' },
    'QA Engineer': { userRole: 'employee', roleLabel: 'QA Engineer' },
    'Sales Manager': { userRole: 'team_manager', roleLabel: 'Sales Manager' },
  };

  // Check if role is in roleMap, return that!
  if (roleMap[role]) {
    return roleMap[role];
  }
  
  // Check if it's a manager or lead otherwise, return team_manager
  if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead')) {
    return { userRole: 'team_manager', roleLabel: role };
  }

  // Default: return employee
  return { userRole: 'employee', roleLabel: role };
};

export const getEmployees = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const query = req.organizationId ? { organizationId: req.organizationId } : {};
    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    // console.error('Get Employees Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployee = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const query = req.organizationId ? { _id: id, organizationId: req.organizationId } : { _id: id };
    const employee = await Employee.findOne(query);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    // console.error('Get Employee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeeByEmployeeId = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { employeeId } = req.params;
    let query: any = { employeeId };
    if (req.organizationId) {
      query.organizationId = req.organizationId;
    }
    
    let employee = await Employee.findOne(query);

    if (!employee) {
      // Check User model if Employee not found (for admin/hr users)
      let userQuery: any = { employeeId };
      if (req.organizationId) {
        userQuery.organizationId = req.organizationId;
      }
      const user = await User.findOne(userQuery);
      if (user) {
        // Create a mock employee object using user data
        employee = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.roleLabel || user.role,
          department: user.department || 'Administration',
          avatar: user.avatar || '',
          status: 'active',
          joinDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          phone: user.phone || '',
          employeeId: user.employeeId,
          salary: 0,
          performance: 0,
          organizationId: user.organizationId,
          toJSON: function() { return this; },
          toObject: function() { return this; }
        } as any;
      }
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    // console.error('Get Employee By EmployeeId Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getEmployeesByManagerName = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { managerName } = req.params;
    const query = req.organizationId ? { manager: managerName, organizationId: req.organizationId } : { manager: managerName };
    const employees = await Employee.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    // console.error('Get Employees By Manager Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createEmployee = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { password, ...employeeData } = req.body;

    // Check if organizationId is provided
    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required. Please make sure you are logged in.',
      });
    }

     // Check if password is provided
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required',
      });
    }

    // Check employee limit
    const { limit, current } = await getEmployeeLimit(req.organizationId);
    if (limit !== -1 && current >= limit) {
      return res.status(400).json({
        success: false,
        message: `Employee limit reached! You can have maximum ${limit} employees.`,
      });
    }

    // Check if employee email already exists
    const query = { email: employeeData.email, organizationId: req.organizationId };
    const existingEmployee = await Employee.findOne(query);
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists',
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

    // Create employee
    const employeeDataWithOrg = { ...employeeData, organizationId: req.organizationId };
    const newEmployee = await Employee.create(employeeDataWithOrg);

    // Hash password
    const passwordToHash = password;
    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    // Create corresponding user for login
    const { userRole, roleLabel } = getRoleDetails(employeeData.role || 'Employee');
    await User.create({
      name: employeeData.name,
      email: employeeData.email,
      password: hashedPassword, // Use hashed password
      role: userRole,
      roleLabel: roleLabel,
      department: employeeData.department,
      avatar: employeeData.avatar,
      employeeId: employeeData.employeeId,
      phone: employeeData.phone,
      manager: employeeData.manager,
      organizationId: req.organizationId,
    });

    // Send welcome email (don't block the response)
    sendWelcomeEmail(
      employeeData.email, 
      employeeData.name, 
      passwordToHash, 
      roleLabel,
      hrUser.name,
      hrUser.email
    ).catch(err => {
      // console.error('Error sending email:', err);
    });

    // Send Slack notification (don't block the response)
    sendNewEmployeeNotification(
      employeeData.name,
      employeeData.email,
      roleLabel,
      employeeData.department || 'Not specified',
      hrUser.name
    ).catch(err => {
      // console.error('Error sending Slack notification:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: newEmployee,
    });
  } catch (error) {
    // console.error('Create Employee Error:', error);
    res.status(500).json({
      success: false,
      message: (error as Error).message || 'Internal server error',
    });
  }
};

export const bulkImportEmployees = async (req: Request, res: Response<ApiResponse>) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Check organization ID
    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required.',
      });
    }

    // Check employee limit first
    const { limit, current } = await getEmployeeLimit(req.organizationId);
    if (limit === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization.',
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

    // Get uploaded file
    const file: any = req.files.file;
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;
    let currentCount = current;

    for (const row of sheetData as ExcelRow[]) {
      // Check limit before creating each employee
      if (limit !== -1 && currentCount >= limit) {
        results.push({
          row,
          success: false,
          message: `Employee limit reached! You can have maximum ${limit} employees.`,
        });
        failCount++;
        continue;
      }
      try {
        // Map Excel columns to employee fields
        const employeeData = {
          name: row.name || row.Name || row['Full Name'],
          email: row.email || row.Email,
          role: row.role || row.Role || row.JobTitle || 'Employee',
          department: row.department || row.Department,
          avatar: row.avatar || row.Avatar || '',
          status: (row.status || row.Status || 'active') as any,
          joinDate: row.joinDate || row.JoinDate || row['Join Date'],
          phone: row.phone || row.Phone || row['Phone Number'],
          employeeId: row.employeeId || row.EmployeeId || row['Employee ID'],
          salary: Number(row.salary || row.Salary),
          performance: Number(row.performance || row.Performance || 50),
          manager: row.manager || row.Manager,
          organizationId: req.organizationId,
        };
        const passwordToHash = (row.password || row.Password) as string;

        // Check required fields
        if (!employeeData.name || !employeeData.email || !employeeData.employeeId || !employeeData.organizationId || !passwordToHash) {
          results.push({
            row,
            success: false,
            message: 'Missing required fields (name, email, employeeId, organizationId, or password)',
          });
          failCount++;
          continue;
        }

        // Check if employee email already exists
        const query = req.organizationId ? { email: employeeData.email, organizationId: req.organizationId } : { email: employeeData.email };
        const existingEmployee = await Employee.findOne(query);
        if (existingEmployee) {
          results.push({
            row,
            success: false,
            message: 'Employee with this email already exists',
          });
          failCount++;
          continue;
        }

        // Create employee
        const newEmployee = await Employee.create(employeeData);

        // Hash password
        const hashedPassword = await bcrypt.hash(passwordToHash, 10);

        // Create corresponding user for login
        const { userRole, roleLabel } = getRoleDetails(employeeData.role);
        
        await User.create({
          name: employeeData.name,
          email: employeeData.email,
          password: hashedPassword, // Use hashed password
          role: userRole,
          roleLabel: roleLabel,
          department: employeeData.department,
          avatar: employeeData.avatar,
          employeeId: employeeData.employeeId,
          phone: employeeData.phone,
          organizationId: req.organizationId,
        });

        // Send welcome email
        sendWelcomeEmail(
          employeeData.email, 
          employeeData.name, 
          passwordToHash, 
          roleLabel,
          hrUser.name,
          hrUser.email
        ).catch(err => {
          // console.error('Error sending email:', err);
        });

        // Send Slack notification
        sendNewEmployeeNotification(
          employeeData.name,
          employeeData.email,
          roleLabel,
          employeeData.department || 'Not specified',
          hrUser.name
        ).catch(err => {
          // console.error('Error sending Slack notification:', err);
        });

        results.push({
          row,
          success: true,
          message: 'Employee created successfully',
        });
        successCount++;
        currentCount++;
      } catch (rowError) {
        // console.error('Error importing row:', rowError);
        results.push({
          row,
          success: false,
          message: (rowError as Error).message,
        });
        failCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Import completed: ${successCount} created, ${failCount} failed`,
      data: {
        successCount,
        failCount,
        results,
      },
    });
  } catch (error) {
    // console.error('Bulk Import Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const updateEmployee = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    const { password, ...employeeData } = req.body;

    // Find employee first with organizationId
    const findQuery = req.organizationId ? { _id: id, organizationId: req.organizationId } : { _id: id };
    const existingEmployee = await Employee.findOne(findQuery);
    
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Update employee
    const updatedEmployee = await Employee.findByIdAndUpdate(id, employeeData, {
      new: true,
      runValidators: true,
    });

    if (!updatedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Prepare user update object
    const userUpdateData: any = {
      name: employeeData.name,
      email: employeeData.email,
      department: employeeData.department,
      avatar: employeeData.avatar,
      phone: employeeData.phone,
    };

    // Hash password if provided
    if (password) {
      userUpdateData.password = await bcrypt.hash(password, 10);
    }

    // Update corresponding user with organizationId
    const userQuery = req.organizationId ? { employeeId: updatedEmployee.employeeId, organizationId: req.organizationId } : { employeeId: updatedEmployee.employeeId };
    await User.findOneAndUpdate(
      userQuery,
      userUpdateData
    );

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: updatedEmployee,
    });
  } catch (error) {
    // console.error('Update Employee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;
    
    // Find employee first with organizationId
    const findQuery = req.organizationId ? { _id: id, organizationId: req.organizationId } : { _id: id };
    const existingEmployee = await Employee.findOne(findQuery);
    
    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Now delete
    const deletedEmployee = await Employee.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Also delete corresponding user with organizationId
    const userQuery = req.organizationId ? { employeeId: deletedEmployee.employeeId, organizationId: req.organizationId } : { employeeId: deletedEmployee.employeeId };
    await User.findOneAndDelete(userQuery);

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    // console.error('Delete Employee Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
