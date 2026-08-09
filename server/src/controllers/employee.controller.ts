import { Request, Response } from 'express';
import Employee from '../models/Employee.model';
import User from '../models/User.model';
import Organization from '../models/Organization.model';
import Pricing from '../models/Pricing.model';
import { ApiResponse } from '../types';
import * as xlsx from 'xlsx';
import { sendWelcomeEmail } from '../utils/email';
import { sendNewEmployeeNotification } from '../utils/slack';
import { sendEmployeeWelcomeEmail } from '../services/emailService';
import { generateSecurePassword, hashPassword } from '../utils/password';
import { EmployeeWelcomeData } from '../templates/employeeWelcomeTemplate';
import { env } from '../config/env';

const getEmployeeLimit = async (organizationId: string): Promise<{ limit: number; current: number }> => {
  const org = await Organization.findById(organizationId);
  if (!org) {
    return { limit: 0, current: 0 };
  }

  let maxEmployees = 0;

  if (!org.isPaid) {
    maxEmployees = 25;
  } else {
    const pricing = await Pricing.findOne({ plan: org.plan || 'Basic' });
    if (pricing) {
      maxEmployees = pricing.employeeLimit;
    } else {
      maxEmployees = org.plan === 'Enterprise' ? -1 : org.plan === 'Pro' ? 500 : 50;
    }
  }

  const currentEmployees = await Employee.countDocuments({ organizationId });

  return {
    limit: maxEmployees,
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
  employmentType?: string;
  officeLocation?: string;
  shift?: string;
  workingHours?: string;
  reportingManager?: string;
}

const getRoleDetails = (role: string) => {
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

  if (roleMap[role]) {
    return roleMap[role];
  }

  if (role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead')) {
    return { userRole: 'team_manager', roleLabel: role };
  }

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
      let userQuery: any = { employeeId };
      if (req.organizationId) {
        userQuery.organizationId = req.organizationId;
      }
      const user = await User.findOne(userQuery);
      if (user) {
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
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const createEmployee = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { password, ...employeeData } = req.body;

    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required. Please make sure you are logged in.',
      });
    }

    const { limit, current } = await getEmployeeLimit(req.organizationId);
    if (limit !== -1 && current >= limit) {
      return res.status(400).json({
        success: false,
        message: `Employee limit reached! You can have maximum ${limit} employees.`,
      });
    }

    const query = { email: employeeData.email, organizationId: req.organizationId };
    const existingEmployee = await Employee.findOne(query);
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists',
      });
    }

    const hrUserId = req.headers['x-user-id'] as string;
    const hrUser = await User.findById(hrUserId);

    if (!hrUser) {
      return res.status(400).json({
        success: false,
        message: 'HR not found',
      });
    }

    const isPasswordAutoGenerated = !password;
    const temporaryPassword = password || generateSecurePassword(12);

    const hashedPassword = await hashPassword(temporaryPassword, 10);

    const employeeDataWithOrg = { ...employeeData, organizationId: req.organizationId };
    const newEmployee = await Employee.create(employeeDataWithOrg);

    const { userRole, roleLabel } = getRoleDetails(employeeData.role || 'Employee');
    await User.create({
      name: employeeData.name,
      email: employeeData.email,
      password: hashedPassword,
      role: userRole,
      roleLabel: roleLabel,
      department: employeeData.department,
      avatar: employeeData.avatar,
      employeeId: employeeData.employeeId,
      phone: employeeData.phone,
      manager: employeeData.manager,
      organizationId: req.organizationId,
      mustChangePassword: true,
      temporaryPasswordSet: true,
    });

    const welcomeEmailData: EmployeeWelcomeData = {
      employeeName: employeeData.name,
      employeeId: employeeData.employeeId,
      email: employeeData.email,
      temporaryPassword: temporaryPassword,
      department: employeeData.department || 'General',
      designation: employeeData.role || 'Employee',
      role: roleLabel,
      managerName: employeeData.manager,
      salary: employeeData.salary,
      joiningDate: employeeData.joinDate,
      employmentType: employeeData.employmentType || 'Full-Time',
      officeLocation: employeeData.officeLocation,
      phoneNumber: employeeData.phone,
      reportingManager: employeeData.reportingManager || employeeData.manager,
      shift: employeeData.shift || 'General',
      workingHours: employeeData.workingHours || '9:00 AM - 6:00 PM',
      employeeStatus: employeeData.status || 'active',
      loginUrl: env.LOGIN_URL,
      hrName: hrUser.name,
      hrEmail: hrUser.email,
    };

    const emailResult = await sendEmployeeWelcomeEmail({
      ...welcomeEmailData,
      employeeId: newEmployee._id.toString(),
      organizationId: req.organizationId,
    });

    sendWelcomeEmail(
      employeeData.email,
      employeeData.name,
      temporaryPassword,
      roleLabel,
      hrUser.name,
      hrUser.email
    ).catch(() => {});

    sendNewEmployeeNotification(
      employeeData.name,
      employeeData.email,
      roleLabel,
      employeeData.department || 'Not specified',
      hrUser.name
    ).catch(() => {});

    let responseMessage = 'Employee created successfully';
    if (emailResult.success) {
      responseMessage = 'Employee created successfully. Welcome email sent successfully.';
    } else {
      responseMessage = 'Employee created successfully. Email could not be sent.';
    }

    const responseData: any = {
      success: true,
      message: responseMessage,
      data: newEmployee,
      passwordAutoGenerated: isPasswordAutoGenerated,
      emailSent: emailResult.success,
    };

    res.status(201).json(responseData);
  } catch (error) {
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

    if (!req.organizationId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required.',
      });
    }

    const { limit, current } = await getEmployeeLimit(req.organizationId);
    if (limit === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid organization.',
      });
    }

    const hrUserId = req.headers['x-user-id'] as string;
    const hrUser = await User.findById(hrUserId);

    if (!hrUser) {
      return res.status(400).json({
        success: false,
        message: 'HR not found',
      });
    }

    const file: any = req.files.file;
    const workbook = xlsx.read(file.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const results: any[] = [];
    let successCount = 0;
    let failCount = 0;
    let currentCount = current;

    for (const row of sheetData as ExcelRow[]) {
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
          employmentType: row.employmentType || 'Full-Time',
          officeLocation: row.officeLocation || '',
          shift: row.shift || 'General',
          workingHours: row.workingHours || '9:00 AM - 6:00 PM',
          reportingManager: row.reportingManager || row.manager || '',
        };

        let passwordToHash = (row.password || row.Password) as string;
        const isAutoGenerated = !passwordToHash;
        if (!passwordToHash) {
          passwordToHash = generateSecurePassword(12);
        }

        if (!employeeData.name || !employeeData.email || !employeeData.employeeId || !employeeData.organizationId || !passwordToHash) {
          results.push({
            row,
            success: false,
            message: 'Missing required fields (name, email, employeeId, organizationId, or password)',
          });
          failCount++;
          continue;
        }

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

        const newEmployee = await Employee.create(employeeData);

        const hashedPassword = await hashPassword(passwordToHash, 10);

        const { userRole, roleLabel } = getRoleDetails(employeeData.role);

        await User.create({
          name: employeeData.name,
          email: employeeData.email,
          password: hashedPassword,
          role: userRole,
          roleLabel: roleLabel,
          department: employeeData.department,
          avatar: employeeData.avatar,
          employeeId: employeeData.employeeId,
          phone: employeeData.phone,
          organizationId: req.organizationId,
          mustChangePassword: true,
          temporaryPasswordSet: true,
        });

        const welcomeEmailData: EmployeeWelcomeData = {
          employeeName: employeeData.name,
          employeeId: employeeData.employeeId,
          email: employeeData.email,
          temporaryPassword: passwordToHash,
          department: employeeData.department || 'General',
          designation: employeeData.role,
          role: roleLabel,
          managerName: employeeData.manager,
          salary: employeeData.salary,
          joiningDate: employeeData.joinDate || new Date().toISOString().split('T')[0],
          employmentType: employeeData.employmentType,
          officeLocation: employeeData.officeLocation,
          phoneNumber: employeeData.phone,
          reportingManager: employeeData.reportingManager,
          shift: employeeData.shift,
          workingHours: employeeData.workingHours,
          employeeStatus: employeeData.status || 'active',
          loginUrl: env.LOGIN_URL,
          hrName: hrUser.name,
          hrEmail: hrUser.email,
        };

        sendEmployeeWelcomeEmail({
          ...welcomeEmailData,
          employeeId: newEmployee._id.toString(),
          organizationId: req.organizationId,
        }).catch(() => {});

        sendWelcomeEmail(
          employeeData.email,
          employeeData.name,
          passwordToHash,
          roleLabel,
          hrUser.name,
          hrUser.email
        ).catch(() => {});

        sendNewEmployeeNotification(
          employeeData.name,
          employeeData.email,
          roleLabel,
          employeeData.department || 'Not specified',
          hrUser.name
        ).catch(() => {});

        results.push({
          row,
          success: true,
          message: 'Employee created successfully',
          passwordAutoGenerated: isAutoGenerated,
        });
        successCount++;
        currentCount++;
      } catch (rowError) {
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

    const findQuery = req.organizationId ? { _id: id, organizationId: req.organizationId } : { _id: id };
    const existingEmployee = await Employee.findOne(findQuery);

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

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

    const userUpdateData: any = {
      name: employeeData.name,
      email: employeeData.email,
      department: employeeData.department,
      avatar: employeeData.avatar,
      phone: employeeData.phone,
    };

    if (password) {
      userUpdateData.password = await hashPassword(password, 10);
    }

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
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const deleteEmployee = async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { id } = req.params;

    const findQuery = req.organizationId ? { _id: id, organizationId: req.organizationId } : { _id: id };
    const existingEmployee = await Employee.findOne(findQuery);

    if (!existingEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const deletedEmployee = await Employee.findByIdAndDelete(id);

    if (!deletedEmployee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const userQuery = req.organizationId ? { employeeId: deletedEmployee.employeeId, organizationId: req.organizationId } : { employeeId: deletedEmployee.employeeId };
    await User.findOneAndDelete(userQuery);

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
