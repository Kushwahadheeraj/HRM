import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord, Notification, User } from './types';

const avatarColors = ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F59E0B'];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Demo data
export const demoUsers: Record<string, User> = {
  '6a3381d85d022f2ca89319d0': {
    _id: '6a3381d85d022f2ca89319d0',
    id: '6a3381d85d022f2ca89319d0',
    name: 'Dev',
    email: 'dev123@gmail.com',
    role: 'employee',
    roleLabel: 'Software Engineer',
    department: 'Engineering',
    avatar: '',
    employeeId: 'TRX-001',
    address: '123 Tech Park, Bangalore',
    country: 'IN'
  },
  team_manager: {
    _id: 'u2',
    id: 'u2',
    name: 'Marcus Johnson',
    email: 'marcus@traxale.com',
    role: 'team_manager',
    roleLabel: 'Team Manager',
    department: 'Product',
    avatar: '',
    employeeId: 'TRX-002',
    address: '456 Product Ave, Mumbai',
    country: 'IN'
  },
  hr_manager: {
    _id: 'u1',
    id: 'u1',
    name: 'Elena Rodriguez',
    email: 'elena@traxale.com',
    role: 'hr_manager',
    roleLabel: 'HR Manager',
    department: 'Human Resources',
    avatar: '',
    employeeId: 'TRX-005',
    address: '789 HR Street, Delhi',
    country: 'IN'
  }
};

export const demoEmployees: Employee[] = [
  {
    _id: '6a3381d85d022f2ca89319d0',
    id: '6a3381d85d022f2ca89319d0',
    name: 'Dev',
    email: 'dev123@gmail.com',
    role: 'Software Engineer',
    department: 'Engineering',
    avatar: '',
    status: 'active',
    joinDate: '2023-01-15',
    phone: '+91 98765 43210',
    employeeId: 'TRX-001',
    salary: 80000,
    performance: 90,
    manager: 'Marcus Johnson',
    address: '123 Tech Park, Bangalore',
    country: 'IN'
  },
  {
    _id: 'u2',
    id: 'u2',
    name: 'Marcus Johnson',
    email: 'marcus.j@traxale.com',
    role: 'Team Manager',
    department: 'Product',
    avatar: '',
    status: 'active',
    joinDate: '2021-08-22',
    phone: '+91 98765 43211',
    employeeId: 'TRX-002',
    salary: 135000,
    performance: 91,
    address: '456 Product Ave, Mumbai',
    country: 'IN'
  },
  {
    _id: 'u3',
    id: 'u3',
    name: 'Sarah Chen',
    email: 'sarah.chen@traxale.com',
    role: 'Senior Engineer',
    department: 'Engineering',
    avatar: '',
    status: 'active',
    joinDate: '2022-03-15',
    phone: '+91 98765 43212',
    employeeId: 'TRX-003',
    salary: 125000,
    performance: 94,
    manager: 'Marcus Johnson',
    address: '789 Tech Park, Bangalore',
    country: 'IN'
  },
  {
    _id: 'u4',
    id: 'u4',
    name: 'Aisha Patel',
    email: 'aisha.p@traxale.com',
    role: 'UX Designer',
    department: 'Design',
    avatar: '',
    status: 'remote',
    joinDate: '2023-01-10',
    phone: '+91 98765 43213',
    employeeId: 'TRX-004',
    salary: 105000,
    performance: 88,
    manager: 'Marcus Johnson',
    address: '321 Design Colony, Pune',
    country: 'IN'
  }
];
