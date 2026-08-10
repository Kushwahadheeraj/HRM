export type UserRole = 'hr_manager' | 'team_manager' | 'employee' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  avatar: string;
  employeeId: string;
  phone?: string;
  shiftId?: string;
  address?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'remote' | 'offline';
  joinDate: string;
  phone: string;
  employeeId: string;
  salary: number;
  performance: number;
  manager?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  lateThreshold: string;
  halfDayThreshold: number;
  isActive: boolean;
  department?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'public' | 'company' | 'optional';
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface Break {
  type: 'lunch' | 'tea' | 'meeting' | 'other';
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'remote' | 'leave' | 'holiday';
  department: string;
  overtime: number;
  workingHours: number;
  totalBreakTime: number;
  method: 'face' | 'gps' | 'qr' | 'biometric' | 'manual' | 'image';
  shiftId?: string;
  clockInImage?: string;
  clockOutImage?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  qrCodeData?: string;
  biometricId?: string;
  verifiedBy?: string;
  notes?: string;
  breaks: Break[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  department: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  month: string;
  status: 'processed' | 'pending' | 'paid';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatMessage {
  id: string;
  userId?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Recruitment {
  id: string;
  jobTitle: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: string;
  status: 'open' | 'closed' | 'on-hold';
  applicants: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DashboardStats {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
  totalEmployees: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: any;
}

export type ThemeMode = 'dark' | 'light';

export type Page = 'landing' | 'login' | 'dashboard' | 'employees' | 'attendance' | 'ai-assistant' | 'analytics' | 'leave' | 'payroll' | 'recruitment' | 'settings' | 'my-profile' | 'my-attendance' | 'my-leaves' | 'my-payroll' | 'team' | 'approvals';
