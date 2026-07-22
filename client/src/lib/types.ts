export type UserRole = 'hr_manager' | 'team_manager' | 'employee' | 'super_admin';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  avatar: string;
  employeeId: string;
  shiftId?: string;
  phone?: string;
  address?: string;
  country?: string;
  organizationId?: string;
  [key: string]: any;
}

export interface Employee {
  _id?: string;
  id?: string;
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
  address?: string;
  country?: string;
  managerName?: string;
  [key: string]: any;
}

export interface TeamManager {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  department: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'remote' | 'offline';
  joinDate: string;
  phone: string;
  [key: string]: any;
}

export interface Shift {
  id?: string;
  _id?: string;
  name: string;
  startTime: string;
  endTime: string;
  lateThreshold: string;
  halfDayThreshold: number;
  isActive: boolean;
  department?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Holiday {
  id?: string;
  _id?: string;
  name: string;
  date: string;
  type: 'public' | 'company' | 'optional';
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface Break {
  type: 'lunch' | 'tea' | 'meeting' | 'other';
  startTime: string;
  endTime?: string;
  duration?: number;
  [key: string]: any;
}

export interface AttendanceRecord {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'remote' | 'leave' | 'holiday' | 'pending';
  department: string;
  overtime?: number;
  workingHours?: number;
  totalBreakTime?: number;
  method?: 'face' | 'gps' | 'qr' | 'biometric' | 'manual' | 'image';
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
  breaks?: Break[];
  isPendingApproval?: boolean;
  approvalStatus?: 'approved' | 'rejected' | 'pending';
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface OfficeLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  radius?: number;
}

export interface AttendanceSettings {
  checkInTime?: string;
  checkOutTime?: string;
  lateThreshold?: string;
}

export interface Organization {
  id?: string;
  _id?: string;
  name: string;
  adminId: string;
  trialStartDate?: string;
  trialEndDate?: string;
  isPaid?: boolean;
  paymentDate?: string;
  plan?: string;
  officeLocation?: OfficeLocation;
  attendanceSettings?: AttendanceSettings;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface DashboardStats {
  present: number;
  absent: number;
  late: number;
  onLeave: number;
  halfDay: number;
  totalEmployees: number;
  [key: string]: any;
}

export interface LeaveRequest {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  days?: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  department?: string;
  [key: string]: any;
}

export interface PayrollRecord {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  bonus?: number;
  deductions?: number;
  totalDeductions?: number;
  overtimePay?: number;
  netSalary?: number;
  month: string;
  status: 'processed' | 'pending' | 'paid';
  hra?: number;
  otherAllowances?: number;
  totalOvertimeHours?: number;
  attendanceDeductions?: number;
  leaveDeductions?: number;
  otherDeductions?: number;
  year?: number;
  totalEarnings?: number;
  attendanceDays?: number;
  absentDays?: number;
  leaveDays?: number;
  [key: string]: any;
}

export interface Performance {
  id?: string;
  _id?: string;
  employeeId: string;
  employeeName: string;
  managerName: string;
  month: string;
  year: number;
  teamwork: number;
  innovation: number;
  communication: number;
  overallScore: number;
  organizationId?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Notification {
  id?: string;
  _id?: string;
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
  [key: string]: any;
}

export interface ChatFile {
  name: string;
  url: string;
  type: string;
  size: number;
  [key: string]: any;
}

export interface ChatReaction {
  emoji: string;
  users: string[];
  [key: string]: any;
}

export interface ChatMessage {
  id?: string;
  _id?: string;
  userId?: string | User;
  channelId?: string;
  role?: string;
  content: string;
  timestamp?: string;
  files?: ChatFile[];
  reactions?: ChatReaction[];
  replies?: string[];
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Channel {
  id?: string;
  _id?: string;
  name: string;
  type: 'team' | 'direct';
  organizationId?: string;
  teamId?: string;
  participants: User[];
  description?: string;
  createdBy: User;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface Review {
  id?: string;
  _id?: string;
  userId: string;
  organizationId?: string;
  organizationName?: string;
  userName: string;
  userRole?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export type ThemeMode = 'dark' | 'light';
export type Page = 'landing' | 'login' | 'register-admin' | 'dashboard' | 'employees' | 'attendance' | 'ai-assistant' | 'analytics' | 'leave' | 'payroll' | 'recruitment' | 'settings' | 'my-profile' | 'my-attendance' | 'my-leaves' | 'my-payroll' | 'team' | 'approvals' | 'team-managers' | 'team-manager-dashboard' | 'performance' | 'super-admin-dashboard' | 'super-admin-pricing' | 'submit-review' | 'super-admin-reviews' | 'organization-settings' | 'attendance-approvals';

// Generic API Response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// Pricing Plan interface
export interface PricingPlan {
  plan: string;
  priceInr: number;
  priceUsd: number;
  employeeLimit: number;
  features: string[];
  [key: string]: any;
}

// Super Admin interface (extends User)
export interface SuperAdmin extends User {
  theme?: ThemeMode;
  accentColor?: string;
  password?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    leaveRequests: boolean;
    attendanceAlerts: boolean;
    aiInsights: boolean;
    [key: string]: boolean;
  };
  integrations?: {
    slack: boolean;
    googleWorkspace: boolean;
    microsoftTeams: boolean;
    zoom: boolean;
    stripe: boolean;
    [key: string]: boolean;
  };
  plan?: string;
  storageUsed?: number;
  storageTotal?: number;
  lastLogin?: Date | string;
  createdAt?: Date | string;
}

// Organization Status interface
export interface OrganizationStatus {
  isPaid: boolean;
  trialStartDate?: string;
  trialEndDate?: string;
  plan?: string;
  paymentDate?: string;
  [key: string]: any;
}

// Organization Stats interface for Super Admin Dashboard
export interface OrganizationStats {
  freeTrialCount: number;
  paidCount: number;
  organizations: Array<{
    _id: string;
    name: string;
    isPaid: boolean;
    trialStartDate: string;
    trialEndDate: string;
    paymentDate?: string;
    createdAt: string;
    plan?: string;
    admin: {
      name: string;
      email: string;
      employeeId: string;
    };
  }>;
  [key: string]: any;
}

// Team Manager Dashboard Stats interface
export interface TeamManagerDashboardStats {
  teamSize: number;
  presentToday: number;
  avgPerformance: number;
  pendingLeaves: number;
  employees: Employee[];
  [key: string]: any;
}

// Weekly Attendance Data interface
export interface WeeklyAttendanceData {
  day: string;
  present: number;
  late: number;
  [key: string]: any;
}

// Message interface
export interface Message {
  _id?: string;
  id?: string;
  from: string;
  to: string;
  content: string;
  createdAt?: string;
  [key: string]: any;
}
