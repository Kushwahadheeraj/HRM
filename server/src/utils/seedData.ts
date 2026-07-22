import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';
import Employee from '../models/Employee.model';
import Attendance from '../models/Attendance.model';
import Leave from '../models/Leave.model';
import Payroll from '../models/Payroll.model';
import Notification from '../models/Notification.model';
import ChatMessage from '../models/ChatMessage.model';
import Recruitment from '../models/Recruitment.model';
import Candidate from '../models/Candidate.model';
import TeamManager from '../models/TeamManager.model';
import bcrypt from 'bcrypt';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traxale-hrm');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Employee.deleteMany({});
    await TeamManager.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await Payroll.deleteMany({});
    await Notification.deleteMany({});
    await ChatMessage.deleteMany({});
    await Recruitment.deleteMany({});
    await Candidate.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Seed Users
    const users = await User.create([
      {
        name: 'Dheeraj Kushwaha',
        email: 'dheeraj01072001@gmail.com',
        password: bcrypt.hashSync('@Dkushwaha123', 10),
        role: 'super_admin',
        roleLabel: 'Super Administrator',
        department: 'Administration',
        avatar: '',
        employeeId: 'TRX-SUPER-ADMIN',
        phone: '8299301972',
      },
      {
        name: 'Elena Rodriguez',
        email: 'elena@traxale.com',
        password: bcrypt.hashSync('password123', 10),
        role: 'hr_manager',
        roleLabel: 'HR Manager',
        department: 'Human Resources',
        avatar: '',
        employeeId: 'TRX-005',
        phone: '+1 555-111-1111',
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus@traxale.com',
        password: bcrypt.hashSync('password123', 10),
        role: 'team_manager',
        roleLabel: 'Team Manager',
        department: 'Product',
        avatar: '',
        employeeId: 'TRX-002',
        phone: '+1 555-222-2222',
      },
      {
        name: 'Dheeraj Kushwaha (Team Manager)',
        email: 'dheeraj@traxale.com',
        password: bcrypt.hashSync('password123', 10),
        role: 'team_manager',
        roleLabel: 'Team Manager',
        department: 'Engineering',
        avatar: '',
        employeeId: 'TRX-013',
        phone: '+1 555-333-3333',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@traxale.com',
        password: bcrypt.hashSync('password123', 10),
        role: 'employee',
        roleLabel: 'Software Engineer',
        department: 'Engineering',
        avatar: '',
        employeeId: 'TRX-001',
        phone: '+1 555-444-4444',
      },
    ]);
    console.log('✅ Users seeded');

    // Seed Employees
    const employees = await Employee.create([
      { name: 'Sarah Chen', email: 'sarah.chen@traxale.com', role: 'Senior Engineer', department: 'Engineering', avatar: '', status: 'active', joinDate: '2022-03-15', phone: '+1 555-0101', employeeId: 'TRX-001', salary: 125000, performance: 94, manager: 'Dheeraj Kushwaha' },
      { name: 'Marcus Johnson', email: 'marcus.j@traxale.com', role: 'Product Manager', department: 'Product', avatar: '', status: 'active', joinDate: '2021-08-22', phone: '+1 555-0102', employeeId: 'TRX-002', salary: 135000, performance: 91 },
      { name: 'Aisha Patel', email: 'aisha.p@traxale.com', role: 'UX Designer', department: 'Design', avatar: '', status: 'remote', joinDate: '2023-01-10', phone: '+1 555-0103', employeeId: 'TRX-003', salary: 105000, performance: 88, manager: 'Marcus Johnson' },
      { name: 'David Kim', email: 'david.k@traxale.com', role: 'DevOps Lead', department: 'Engineering', avatar: '', status: 'active', joinDate: '2020-11-05', phone: '+1 555-0104', employeeId: 'TRX-004', salary: 140000, performance: 96, manager: 'Dheeraj Kushwaha' },
      { name: 'Elena Rodriguez', email: 'elena.r@traxale.com', role: 'HR Manager', department: 'Human Resources', avatar: '', status: 'active', joinDate: '2021-04-18', phone: '+1 555-0105', employeeId: 'TRX-005', salary: 110000, performance: 92 },
      { name: 'James Wright', email: 'james.w@traxale.com', role: 'Data Scientist', department: 'Engineering', avatar: '', status: 'on-leave', joinDate: '2022-07-01', phone: '+1 555-0106', employeeId: 'TRX-006', salary: 130000, performance: 89, manager: 'Dheeraj Kushwaha' },
      { name: 'Yuki Tanaka', email: 'yuki.t@traxale.com', role: 'Frontend Developer', department: 'Engineering', avatar: '', status: 'active', joinDate: '2023-05-20', phone: '+1 555-0107', employeeId: 'TRX-007', salary: 115000, performance: 87, manager: 'Dheeraj Kushwaha' },
      { name: 'Omar Hassan', email: 'omar.h@traxale.com', role: 'Marketing Director', department: 'Marketing', avatar: '', status: 'active', joinDate: '2020-02-14', phone: '+1 555-0108', employeeId: 'TRX-008', salary: 145000, performance: 93 },
      { name: 'Lisa Chang', email: 'lisa.c@traxale.com', role: 'Finance Analyst', department: 'Finance', avatar: '', status: 'remote', joinDate: '2022-09-12', phone: '+1 555-0109', employeeId: 'TRX-009', salary: 95000, performance: 85 },
      { name: 'Ryan Foster', email: 'ryan.f@traxale.com', role: 'Backend Developer', department: 'Engineering', avatar: '', status: 'active', joinDate: '2023-02-28', phone: '+1 555-0110', employeeId: 'TRX-010', salary: 120000, performance: 90, manager: 'Dheeraj Kushwaha' },
      { name: 'Priya Sharma', email: 'priya.s@traxale.com', role: 'QA Engineer', department: 'Engineering', avatar: '', status: 'active', joinDate: '2021-12-01', phone: '+1 555-0111', employeeId: 'TRX-011', salary: 100000, performance: 86, manager: 'Marcus Johnson' },
      { name: 'Alex Morgan', email: 'alex.m@traxale.com', role: 'Sales Manager', department: 'Sales', avatar: '', status: 'active', joinDate: '2022-06-15', phone: '+1 555-0112', employeeId: 'TRX-012', salary: 115000, performance: 91 },
      { name: 'Dheeraj Kushwaha', email: 'dheeraj@traxale.com', role: 'Team Manager', department: 'Engineering', avatar: '', status: 'active', joinDate: '2023-01-01', phone: '+1 555-333-3333', employeeId: 'TRX-013', salary: 140000, performance: 95 },
    ]);
    console.log('✅ Employees seeded');

    // Seed Team Managers
    await TeamManager.create([
      { name: 'Marcus Johnson', email: 'marcus@traxale.com', department: 'Product', avatar: '', status: 'active', joinDate: '2021-08-22', phone: '+1 555-222-2222', employeeId: 'TRX-002' },
      { name: 'Alex Morgan', email: 'alex.m@traxale.com', department: 'Sales', avatar: '', status: 'active', joinDate: '2022-06-15', phone: '+1 555-0112', employeeId: 'TRX-012' },
      { name: 'Dheeraj Kushwaha', email: 'dheeraj@traxale.com', department: 'Engineering', avatar: '', status: 'active', joinDate: '2023-01-01', phone: '+1 555-333-3333', employeeId: 'TRX-013' },
    ]);
    console.log('✅ Team Managers seeded');

    // Seed Attendance - multiple days in January 2025
    const jan2025Dates = ['01', '02', '03', '06', '07', '08', '09', '10', '13', '14', '15', '16', '17', '20', '21', '22', '23', '24', '27', '28', '29', '30', '31'];
    const attendanceRecords: any[] = [];
    
    jan2025Dates.forEach(day => {
      const date = `2025-01-${day}`;
      
      // Sarah Chen - present all days
      attendanceRecords.push({
        employeeId: 'TRX-001',
        employeeName: 'Sarah Chen',
        date,
        clockIn: '08:45',
        clockOut: '17:30',
        status: 'present',
        department: 'Engineering',
        overtime: 0.5,
        method: 'face'
      });
      
      // Marcus Johnson - late on day 10, present others
      attendanceRecords.push({
        employeeId: 'TRX-002',
        employeeName: 'Marcus Johnson',
        date,
        clockIn: day === '10' ? '09:30' : '09:15',
        clockOut: '18:00',
        status: day === '10' ? 'late' : 'present',
        department: 'Product',
        overtime: 0,
        method: 'gps'
      });
      
      // Aisha Patel - remote
      attendanceRecords.push({
        employeeId: 'TRX-003',
        employeeName: 'Aisha Patel',
        date,
        clockIn: '08:30',
        clockOut: '17:00',
        status: 'remote',
        department: 'Design',
        overtime: 0,
        method: 'qr'
      });
      
      // David Kim - present
      attendanceRecords.push({
        employeeId: 'TRX-004',
        employeeName: 'David Kim',
        date,
        clockIn: '07:55',
        clockOut: '19:00',
        status: 'present',
        department: 'Engineering',
        overtime: 2,
        method: 'biometric'
      });
      
      // Elena Rodriguez - present
      attendanceRecords.push({
        employeeId: 'TRX-005',
        employeeName: 'Elena Rodriguez',
        date,
        clockIn: '08:50',
        clockOut: '17:15',
        status: 'present',
        department: 'Human Resources',
        overtime: 0,
        method: 'face'
      });
      
      // James Wright - absent on day 06, 07, 08, 09
      if (['06', '07', '08', '09'].includes(day)) {
        attendanceRecords.push({
          employeeId: 'TRX-006',
          employeeName: 'James Wright',
          date,
          clockIn: '',
          clockOut: '',
          status: 'absent',
          department: 'Engineering',
          overtime: 0,
          method: 'manual'
        });
      } else {
        attendanceRecords.push({
          employeeId: 'TRX-006',
          employeeName: 'James Wright',
          date,
          clockIn: '09:00',
          clockOut: '17:30',
          status: 'present',
          department: 'Engineering',
          overtime: 0,
          method: 'face'
        });
      }
      
      // Omar Hassan - present all days
      attendanceRecords.push({
        employeeId: 'TRX-008',
        employeeName: 'Omar Hassan',
        date,
        clockIn: '08:30',
        clockOut: '18:30',
        status: 'present',
        department: 'Marketing',
        overtime: 1,
        method: 'gps'
      });
      
      // Priya Sharma - half-day on day 15, sick leave (unpaid) on day 20
      if (day === '20') {
        attendanceRecords.push({
          employeeId: 'TRX-011',
          employeeName: 'Priya Sharma',
          date,
          clockIn: '',
          clockOut: '',
          status: 'absent', // Mark as absent since it's unpaid sick leave
          department: 'Engineering',
          overtime: 0,
          method: 'manual'
        });
      } else if (day === '15') {
        attendanceRecords.push({
          employeeId: 'TRX-011',
          employeeName: 'Priya Sharma',
          date,
          clockIn: '09:05',
          clockOut: '13:00',
          status: 'half-day',
          department: 'Engineering',
          overtime: 0,
          method: 'qr'
        });
      } else {
        attendanceRecords.push({
          employeeId: 'TRX-011',
          employeeName: 'Priya Sharma',
          date,
          clockIn: '08:40',
          clockOut: '17:45',
          status: 'present',
          department: 'Engineering',
          overtime: 0.75,
          method: 'biometric'
        });
      }
    });

    await Attendance.create(attendanceRecords);
    console.log('✅ Attendance seeded');

    // Seed Leaves
    await Leave.create([
      { employeeId: 'TRX-001', employeeName: 'Sarah Chen', type: 'annual', startDate: '2025-02-10', endDate: '2025-02-14', days: 5, reason: 'Family vacation planned for winter break', status: 'approved', department: 'Engineering' },
      { employeeId: 'TRX-003', employeeName: 'Aisha Patel', type: 'sick', startDate: '2025-01-20', endDate: '2025-01-21', days: 2, reason: 'Medical appointment and recovery', status: 'pending', department: 'Design' },
      { employeeId: 'TRX-006', employeeName: 'James Wright', type: 'personal', startDate: '2025-01-06', endDate: '2025-01-09', days: 4, reason: 'Personal family matters', status: 'approved', department: 'Engineering' },
      { employeeId: 'TRX-008', employeeName: 'Omar Hassan', type: 'annual', startDate: '2025-03-01', endDate: '2025-03-07', days: 5, reason: 'Holiday travel with family', status: 'pending', department: 'Marketing' },
      { employeeId: 'TRX-011', employeeName: 'Priya Sharma', type: 'sick', startDate: '2025-01-20', endDate: '2025-01-20', days: 1, reason: 'Flu symptoms', status: 'approved', department: 'Engineering' },
      { employeeId: 'TRX-002', employeeName: 'Marcus Johnson', type: 'paternity', startDate: '2025-04-01', endDate: '2025-04-14', days: 10, reason: 'Paternity leave for newborn', status: 'pending', department: 'Product' },
      { employeeId: 'TRX-004', employeeName: 'David Kim', type: 'annual', startDate: '2025-02-20', endDate: '2025-02-24', days: 3, reason: 'Weekend getaway trip', status: 'pending', department: 'Engineering' },
    ]);
    console.log('✅ Leaves seeded');

    // Seed Payroll for multiple months (Aug 2024 - Jan 2025)
    const payrollMonths = [
      { month: 'August', year: 2024 },
      { month: 'September', year: 2024 },
      { month: 'October', year: 2024 },
      { month: 'November', year: 2024 },
      { month: 'December', year: 2024 },
      { month: 'January', year: 2025 }
    ];

    const payrollRecords: any[] = [];
    const payrollEmployees = [
      { employeeId: 'TRX-001', employeeName: 'Sarah Chen', department: 'Engineering', baseSalary: 10417 },
      { employeeId: 'TRX-002', employeeName: 'Marcus Johnson', department: 'Product', baseSalary: 11250 },
      { employeeId: 'TRX-003', employeeName: 'Aisha Patel', department: 'Design', baseSalary: 8750 },
      { employeeId: 'TRX-004', employeeName: 'David Kim', department: 'Engineering', baseSalary: 11667 },
      { employeeId: 'TRX-005', employeeName: 'Elena Rodriguez', department: 'Human Resources', baseSalary: 9167 },
      { employeeId: 'TRX-006', employeeName: 'James Wright', department: 'Engineering', baseSalary: 10833 },
      { employeeId: 'TRX-008', employeeName: 'Omar Hassan', department: 'Marketing', baseSalary: 12083 },
      { employeeId: 'TRX-011', employeeName: 'Priya Sharma', department: 'Engineering', baseSalary: 8333 }
    ];

    payrollMonths.forEach((payrollMonth, monthIndex) => {
      payrollEmployees.forEach((emp, empIndex) => {
        const hra = emp.baseSalary * 0.2;
        const bonus = emp.baseSalary * 0.1;
        const otherAllowances = emp.baseSalary * 0.08;
        
        // Calculate overtime pay for January 2025 (last month)
        let overtimePay = 0;
        let totalOvertimeHours = 0;
        
        if (payrollMonth.month === 'January') {
          const daysInMonth = 31;
          const perDaySalary = emp.baseSalary / daysInMonth;
          const perHourSalary = perDaySalary / 8;
          
          // Sarah Chen: 0.5 hours overtime/day * 23 days = 11.5 hours
          if (emp.employeeId === 'TRX-001') {
            totalOvertimeHours = 11.5;
          }
          // David Kim: 2 hours overtime/day * 23 days = 46 hours
          else if (emp.employeeId === 'TRX-004') {
            totalOvertimeHours = 46;
          }
          // Omar Hassan: 1 hour overtime/day * 23 days = 23 hours
          else if (emp.employeeId === 'TRX-008') {
            totalOvertimeHours = 23;
          }
          // Priya Sharma: 0.75 hours overtime/day * 22 days (excluding half-day and sick day) = 16.5 hours
          else if (emp.employeeId === 'TRX-011') {
            totalOvertimeHours = 16.5;
          }
          
          overtimePay = totalOvertimeHours * perHourSalary * 1.5;
        }
        
        const totalEarnings = emp.baseSalary + hra + bonus + otherAllowances + overtimePay;
        const otherDeductions = totalEarnings * 0.1; // 10% tax
        let attendanceDeductions = 0;
        let leaveDeductions = 0;
        let absentDays = 0;
        let leaveDays = 0;
        
        // Add attendance deductions for January 2025
        if (payrollMonth.month === 'January') {
          const daysInMonth = 31;
          const perDaySalary = emp.baseSalary / daysInMonth;
          
          // James Wright: 4 absent days
          if (emp.employeeId === 'TRX-006') {
            absentDays = 4;
            attendanceDeductions = absentDays * perDaySalary;
          }
          // Priya Sharma: 1 half-day, 1 absent day
          else if (emp.employeeId === 'TRX-011') {
            absentDays = 1;
            const halfDayDeductions = (perDaySalary / 2);
            attendanceDeductions = (absentDays * perDaySalary) + halfDayDeductions;
          }
        }
        
        const totalDeductions = attendanceDeductions + leaveDeductions + otherDeductions;
        const netSalary = totalEarnings - totalDeductions;

        // Determine status based on month - last month is pending, previous are paid
        let status: 'pending' | 'processed' | 'paid' = 'paid';
        if (monthIndex === payrollMonths.length - 1) {
          status = empIndex % 2 === 0 ? 'paid' : (empIndex === 5 ? 'pending' : 'processed');
        }

        payrollRecords.push({
          employeeId: emp.employeeId,
          employeeName: emp.employeeName,
          department: emp.department,
          baseSalary: emp.baseSalary,
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
          month: payrollMonth.month,
          year: payrollMonth.year,
          attendanceDays: 23 - absentDays,
          absentDays,
          leaveDays,
          status
        });
      });
    });

    await Payroll.create(payrollRecords);
    console.log('✅ Payroll seeded');

    // Seed Notifications
    await Notification.create([
      { title: 'Leave Request', message: 'Aisha Patel requested 2 days sick leave', type: 'warning', time: '5 min ago', read: false },
      { title: 'Payroll Processed', message: 'January payroll processed for 12 employees', type: 'success', time: '1 hour ago', read: false },
      { title: 'New Hire', message: 'Tom Baker joins Engineering team', type: 'info', time: '2 hours ago', read: false },
      { title: 'Attendance Alert', message: 'James Wright absent for 2 consecutive days', type: 'error', time: '3 hours ago', read: true },
      { title: 'Performance Review', message: 'Q4 performance reviews due by Jan 31', type: 'info', time: '1 day ago', read: true },
      { title: 'System Update', message: 'AI Assistant v2.0 deployed successfully', type: 'success', time: '2 days ago', read: true },
    ]);
    console.log('✅ Notifications seeded');

    // Seed Chat Messages
    await ChatMessage.create([
      { role: 'user', content: 'Hello, I need help with my leave request', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { role: 'assistant', content: 'Hi there! How can I help you with your leave request?', timestamp: new Date(Date.now() - 86400000 + 10000).toISOString() },
    ]);
    console.log('✅ Chat Messages seeded');

    // Seed Recruitment
    const recruitmentData = await Recruitment.create([
      {
        jobTitle: 'Senior Software Engineer',
        department: 'Engineering',
        location: 'San Francisco, CA',
        jobType: 'full-time',
        experience: '5+ years',
        description: 'We are looking for a senior software engineer to join our team and help build our next-generation products.',
        requirements: [
          '5+ years of experience with JavaScript/TypeScript',
          'Experience with React or Vue',
          'Strong problem-solving skills',
          'Excellent communication skills'
        ],
        responsibilities: [
          'Develop and maintain web applications',
          'Mentor junior team members',
          'Participate in code reviews',
          'Collaborate with product and design teams'
        ],
        salary: '$150,000 - $180,000',
        status: 'open',
        applicants: 12,
      },
      {
        jobTitle: 'UX Designer',
        department: 'Design',
        location: 'Remote',
        jobType: 'full-time',
        experience: '3+ years',
        description: 'Join our design team and help create beautiful, user-centric experiences for our products.',
        requirements: [
          '3+ years of UX design experience',
          'Proficiency in Figma',
          'Strong portfolio of work',
          'Good understanding of user research'
        ],
        responsibilities: [
          'Create wireframes and prototypes',
          'Conduct user research',
          'Collaborate with product and engineering teams',
          'Create design systems'
        ],
        salary: '$100,000 - $130,000',
        status: 'open',
        applicants: 8,
      },
      {
        jobTitle: 'HR Coordinator',
        department: 'Human Resources',
        location: 'New York, NY',
        jobType: 'full-time',
        experience: '2+ years',
        description: 'Help us manage our HR processes and support our employees.',
        requirements: [
          '2+ years of HR experience',
          'Strong organizational skills',
          'Excellent interpersonal skills',
          'Knowledge of HRIS systems'
        ],
        responsibilities: [
          'Manage employee onboarding',
          'Coordinate HR events',
          'Support employee relations',
          'Maintain employee records'
        ],
        salary: '$70,000 - $90,000',
        status: 'open',
        applicants: 15,
      },
    ]);
    console.log('✅ Recruitment seeded');
    
    // Seed Candidates
    await Candidate.create([
      {
        name: 'Tom Baker',
        email: 'tom.baker@email.com',
        phone: '+1 555-444-4444',
        role: 'Senior Software Engineer',
        stage: 'Interview',
        rating: 4.5,
        source: 'LinkedIn',
        applicationDate: new Date('2025-01-10'),
        resume: '',
        notes: 'Strong technical skills, good cultural fit'
      },
      {
        name: 'Amy Chen',
        email: 'amy.chen@email.com',
        phone: '+1 555-444-4445',
        role: 'UX Designer',
        stage: 'Screening',
        rating: 4.2,
        source: 'Referral',
        applicationDate: new Date('2025-01-12'),
        resume: '',
        notes: 'Great portfolio, referred by Aisha Patel'
      },
      {
        name: 'Jake Wilson',
        email: 'jake.w@email.com',
        phone: '+1 555-444-4446',
        role: 'Senior Software Engineer',
        stage: 'Offer',
        rating: 4.8,
        source: 'Website',
        applicationDate: new Date('2025-01-08'),
        resume: '',
        notes: 'Exceptional candidate, offer sent'
      },
      {
        name: 'Lisa Park',
        email: 'lisa.park@email.com',
        phone: '+1 555-444-4447',
        role: 'Senior Software Engineer',
        stage: 'Interview',
        rating: 4.0,
        source: 'Job Board',
        applicationDate: new Date('2025-01-11'),
        resume: '',
        notes: 'Good experience, need to check cultural fit'
      },
      {
        name: 'Mike Ross',
        email: 'mike.ross@email.com',
        phone: '+1 555-444-4448',
        role: 'HR Coordinator',
        stage: 'Screening',
        rating: 3.8,
        source: 'LinkedIn',
        applicationDate: new Date('2025-01-14'),
        resume: '',
        notes: 'Strong HR background, let\'s schedule interview'
      },
      {
        name: 'Emily Davis',
        email: 'emily.d@email.com',
        phone: '+1 555-444-4449',
        role: 'UX Designer',
        stage: 'Applied',
        rating: 0,
        source: 'Referral',
        applicationDate: new Date('2025-01-20'),
        resume: '',
        notes: 'Applied yesterday, need to review application'
      },
      {
        name: 'Chris Lee',
        email: 'chris.l@email.com',
        phone: '+1 555-444-4450',
        role: 'Senior Software Engineer',
        stage: 'Applied',
        rating: 0,
        source: 'LinkedIn',
        applicationDate: new Date('2025-01-18'),
        resume: '',
        notes: 'Applied recently, initial screening pending'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.w@email.com',
        phone: '+1 555-444-4451',
        role: 'HR Coordinator',
        stage: 'Applied',
        rating: 0,
        source: 'Other',
        applicationDate: new Date('2025-01-15'),
        resume: '',
        notes: 'New application received'
      },
    ]);
    console.log('✅ Candidates seeded');

    console.log('\n🎉 All data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
