import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useApp } from '../App';
import {
  Users, Clock, TrendingUp, ArrowUpRight,
  ArrowDownRight, CheckCircle2, Wifi, MapPin,
  Brain, Calendar, DollarSign, UserPlus,
  CreditCard, ClipboardCheck, Star, Award, Target, Zap
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { getInitials, getAvatarColor } from '../lib/data';
import { employeesAPI, attendanceAPI, analyticsAPI, teamManagersAPI, leavesAPI, payrollAPI, authAPI } from '../lib/api';

// Reusable Trial Status Header Component
function TrialStatusHeader() {
  const { currentUser } = useApp();
  const [trialStatus, setTrialStatus] = useState<any>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role === 'super_admin') return;
    const fetchTrialStatus = async () => {
      try {
        const res = await authAPI.getOrganizationStatus();
        if (res.success) {
          setTrialStatus(res.data);
        }
      } catch (error) {
        console.error('Failed to fetch trial status:', error);
      }
    };
    fetchTrialStatus();
  }, [currentUser]);

  if (!trialStatus || currentUser?.role === 'super_admin') return null;

  const isPaid = trialStatus.isPaid;
  const daysRemaining = trialStatus.daysRemaining;

  if (isPaid) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <CheckCircle2 size={14} style={{ color: '#10B981' }} />
        <span className="text-xs font-semibold" style={{ color: '#10B981' }}>Paid Plan</span>
      </div>
    );
  }

  if (daysRemaining === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <Zap size={14} style={{ color: '#EF4444' }} />
        <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>Trial Expired - Upgrade Now</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
      <Zap size={14} style={{ color: '#F97316' }} />
      <span className="text-xs font-semibold" style={{ color: '#F97316' }}>Free Trial - {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''} Left</span>
    </div>
  );
}

// Types for Dashboard data
interface AttendanceWeeklyItem {
  day: string;
  present: number;
  late: number;
  absent: number;
}

interface MonthlyAttendanceTrendItem {
  month: string;
  rate: number;
}

interface ProductivityItem {
  hour: string;
  value: number;
}

const pieData = [
  { name: 'Present', value: 0, color: '#10B981' },
  { name: 'Late', value: 0, color: '#F59E0B' },
  { name: 'Absent', value: 0, color: '#EF4444' },
  { name: 'Remote', value: 0, color: '#3B82F6' },
];

export default function Dashboard() {
  const { setCurrentPage, currentUser } = useApp();
  const role = currentUser?.role || 'employee';

  if (role === 'employee') return <EmployeeDashboard />;
  if (role === 'team_manager') return <ManagerDashboard />;
  return <HRDashboard />;
}

function EmployeeDashboard() {
  const { setCurrentPage, currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState(0);
  const [recentPayroll, setRecentPayroll] = useState<any>(null);
  const greeting = getGreeting();

  useEffect(() => {
    const fetchEmployeeData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        // Fetch employee data by employeeId
        const empRes = await employeesAPI.getByEmployeeId(currentUser.employeeId);
        if (empRes.success && empRes.data) {
          setEmployeeData(empRes.data);
        }
        // Fetch attendance records for employee
        const attRes = await attendanceAPI.getByEmployee(currentUser.employeeId);
        if (attRes.success && attRes.data) {
          setAttendanceRecords(attRes.data);
        }
        // Fetch leave data to calculate balance
        const leaveRes = await leavesAPI.getByEmployee(currentUser.employeeId);
        if (leaveRes.success && leaveRes.data) {
          // Calculate balance (demo logic, adjust based on your leave type system)
          const totalApproved = leaveRes.data.filter(l => l.status === 'approved').reduce((sum: number, l: any) => sum + l.days, 0);
          setLeaveBalance(20 - totalApproved); // 20 days annual leave
        }
        // Fetch payroll data
        const payrollRes = await payrollAPI.getByEmployee(currentUser.employeeId);
        if (payrollRes.success && payrollRes.data && payrollRes.data.length > 0) {
          setRecentPayroll(payrollRes.data[payrollRes.data.length - 1]);
        }
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeData();
  }, [currentUser]);

  const daysPresent = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'remote' || r.status === 'half-day').length;
  const totalDays = attendanceRecords.length || 23; // default if no records yet
  const performance = employeeData?.performance || 0;
  const netSalary = recentPayroll?.netSalary || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{greeting}, {currentUser?.name.split(' ')[0]}! 👋</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here is your personal workspace overview</p>
          </div>
          <TrialStatusHeader />
        </div>
        <button onClick={() => setCurrentPage('my-attendance')} className="flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <Clock size={18} /> Clock In Now
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Days Present', value: `${daysPresent}/${totalDays}`, icon: CheckCircle2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
          { title: 'Leave Balance', value: `${leaveBalance} days`, icon: Calendar, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
          { title: 'Performance', value: `${performance}%`, icon: Star, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
          { title: 'Net Salary', value: `$${netSalary.toLocaleString()}`, icon: CreditCard, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer transition-all" onClick={() => setCurrentPage(i === 0 ? 'my-attendance' : i === 1 ? 'my-leaves' : i === 2 ? 'my-profile' : 'my-payroll')}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                <Icon size={22} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Clock In/Out', icon: Clock, color: '#10B981', page: 'my-attendance' as const },
            { label: 'Apply Leave', icon: Calendar, color: '#F59E0B', page: 'my-leaves' as const },
            { label: 'View Payslips', icon: DollarSign, color: '#3B82F6', page: 'my-payroll' as const },
            { label: 'My Profile', icon: UserPlus, color: '#8B5CF6', page: 'my-profile' as const },
          ].map((action, i) => (
            <button key={i} onClick={() => setCurrentPage(action.page)} className="flex flex-col items-center gap-2 p-5 rounded-xl transition-all hover:scale-105" style={{ background: action.color + '10', border: '1px solid ' + action.color + '20' }}>
              <action.icon size={20} style={{ color: action.color }} />
              <span className="text-xs font-medium" style={{ color: action.color }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Attendance + AI */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Attendance</h3>
          <div className="space-y-3">
            {attendanceRecords.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: i < 3 ? '1px solid var(--border-color)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: r.status === 'present' ? '#10B981' : r.status === 'late' ? '#F59E0B' : r.status === 'remote' ? '#3B82F6' : '#64748B' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{new Date(r.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span>In: {r.clockIn || '-'}</span>
                  <span className="font-medium">{r.clockOut ? (new Date(`2000-01-01T${r.clockOut}`).getHours() - new Date(`2000-01-01T${r.clockIn}`).getHours() + 'h') : '-'}</span>
                </div>
              </div>
            ))}
            {attendanceRecords.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No attendance records yet</p>
            )}
          </div>
          <button onClick={() => setCurrentPage('my-attendance')} className="mt-4 text-xs font-medium" style={{ color: '#3B82F6' }}>View full history →</button>
        </div>

        <div className="glass-card p-6 rounded-2xl" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="flex items-center gap-2 mb-4">
            <Brain size={18} style={{ color: '#3B82F6' }} />
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Insight for You</h3>
          </div>
          <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
            Your attendance consistency is {totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0}% this month.
            Keep up the great work! You have used {20 - leaveBalance} out of 20 annual leave days.
          </p>
          <button onClick={() => setCurrentPage('ai-assistant')} className="text-xs font-medium flex items-center gap-1" style={{ color: '#3B82F6' }}>
            <Brain size={12} /> Ask AI for more insights
          </button>
        </div>
      </div>
    </div>
  );
}

function ManagerDashboard() {
  const { setCurrentPage, currentUser } = useApp();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceWeeklyData, setAttendanceWeeklyData] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>({ teamSize: 0, presentToday: 0, avgPerformance: 0, pendingLeaves: 0 });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      try {
        setLoading(true);
        const [statsRes, weeklyRes] = await Promise.all([
          teamManagersAPI.getDashboardStats(currentUser.name),
          teamManagersAPI.getWeeklyAttendance(currentUser.name)
        ]);
        if (statsRes.success && statsRes.data) {
          setDashboardStats(statsRes.data);
          setEmployees(statsRes.data.employees || []);
        }
        if (weeklyRes.success && weeklyRes.data) {
          setAttendanceWeeklyData(weeklyRes.data);
        }
      } catch (error) {
        console.error("Error fetching team manager data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const greeting = getGreeting();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{greeting}, {currentUser?.name.split(' ')[0]}! 👋</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your team overview for today</p>
          </div>
          <TrialStatusHeader />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage('approvals')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <ClipboardCheck size={16} /> {dashboardStats.pendingLeaves} Pending Approvals
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Team Size', value: dashboardStats.teamSize.toString(), icon: Users, color: '#3B82F6' },
          { title: 'Present Today', value: dashboardStats.presentToday.toString(), icon: CheckCircle2, color: '#10B981' },
          { title: 'Avg Performance', value: dashboardStats.avgPerformance + '%', icon: Award, color: '#F59E0B' },
          { title: 'Pending Leaves', value: dashboardStats.pendingLeaves.toString(), icon: Calendar, color: '#8B5CF6' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3" style={{ background: stat.color + '15' }}>
                <Icon size={22} style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Team Attendance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Team Attendance Today</h3>
          <div className="space-y-3">
            {employees.map((emp, i) => (
              <div key={emp.id} className="flex items-center justify-between py-2" style={{ borderBottom: i < employees.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(emp.name) }}>
                      {getInitials(emp.name)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: emp.status === 'active' ? '#10B981' : emp.status === 'on-leave' ? '#F59E0B' : '#64748B', borderColor: 'var(--bg-secondary)' }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{emp.role}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold capitalize" style={{ background: emp.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : emp.status === 'on-leave' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: emp.status === 'active' ? '#10B981' : emp.status === 'on-leave' ? '#F59E0B' : '#64748B' }}>{emp.status}</span>
              </div>
            ))}
            {employees.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No team members yet</p>
            )}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Team Performance</h3>
          <div className="space-y-4">
            {employees.sort((a, b) => b.performance - a.performance).map((emp, i) => (
              <div key={emp.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{emp.name}</span>
                  <span className="text-xs font-bold" style={{ color: emp.performance >= 90 ? '#10B981' : '#F59E0B' }}>{emp.performance}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: emp.performance + '%' }} transition={{ duration: 1, delay: i * 0.15 }} className="h-full rounded-full" style={{ background: emp.performance >= 90 ? '#10B981' : '#F59E0B' }} />
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No team members yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Weekly Team Attendance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={attendanceWeeklyData.length > 0 ? attendanceWeeklyData : [
            { day: 'Mon', present: 0, late: 0, absent: 0 },
            { day: 'Tue', present: 0, late: 0, absent: 0 },
            { day: 'Wed', present: 0, late: 0, absent: 0 },
            { day: 'Thu', present: 0, late: 0, absent: 0 },
            { day: 'Fri', present: 0, late: 0, absent: 0 }
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
            <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            <Bar dataKey="present" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="late" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HRDashboard() {
  const { setCurrentPage, currentUser } = useApp();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [attendanceWeeklyData, setAttendanceWeeklyData] = useState<any[]>([]);
  const [monthlyAttendanceTrend, setMonthlyAttendanceTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const greeting = getGreeting();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [empRes, attRes, statsRes, deptRes, attTrendRes] = await Promise.all([
          employeesAPI.getAll(),
          attendanceAPI.getAll(),
          analyticsAPI.getDashboardStats(),
          analyticsAPI.getDepartmentStats(),
          analyticsAPI.getAttendanceTrends(),
        ]);
        if (empRes.success && empRes.data) setEmployees(empRes.data);
        if (attRes.success && attRes.data) setAttendanceRecords(attRes.data);
        if (statsRes.success && statsRes.data) setDashboardStats(statsRes.data);
        if (attTrendRes.success && attTrendRes.data) {
          setMonthlyAttendanceTrend(attTrendRes.data);
        }
      } catch (error) {
        // No demo data fallback removed
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statsData = [
    { 
      title: 'Total Employees', 
      value: dashboardStats?.totalEmployees || employees.length, 
      change: '+0', 
      trend: 'up', 
      icon: Users, 
      color: '#3B82F6', 
      bg: 'rgba(59, 130, 246, 0.1)' 
    },
    { 
      title: 'Present Today', 
      value: dashboardStats?.presentToday || attendanceRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'remote' || r.status === 'half-day').length, 
      change: dashboardStats?.attendanceRate ? `${dashboardStats.attendanceRate}%` : '0%', 
      trend: 'up', 
      icon: CheckCircle2, 
      color: '#10B981', 
      bg: 'rgba(16, 185, 129, 0.1)' 
    },
    { 
      title: 'Late Arrivals', 
      value: attendanceRecords.filter(r => r.status === 'late').length, 
      change: '+0', 
      trend: 'down', 
      icon: Clock, 
      color: '#F59E0B', 
      bg: 'rgba(245, 158, 11, 0.1)' 
    },
    { 
      title: 'On Leave', 
      value: dashboardStats?.onLeaveEmployees || employees.filter(e => e.status === 'on-leave').length, 
      change: '+0', 
      trend: 'up', 
      icon: Calendar, 
      color: '#8B5CF6', 
      bg: 'rgba(139, 92, 246, 0.1)' 
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{greeting}, {currentUser?.name.split(' ')[0]}! 👋</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Here is what is happening across the organization today</p>
          </div>
          <TrialStatusHeader />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Wifi size={14} style={{ color: '#10B981' }} />
            <span className="text-xs font-medium" style={{ color: '#10B981' }}>All Systems Online</span>
          </div>
          <button onClick={() => setCurrentPage('ai-assistant')} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
            <Brain size={16} /> AI Insights
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card glass-card glass-card-hover p-5 rounded-2xl cursor-pointer transition-all" onClick={() => setCurrentPage(i === 0 ? 'employees' : 'attendance')}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                  <Icon size={22} style={{ color: stat.color }} />
                </div>
                <div className={'flex items-center gap-1 text-xs font-semibold ' + (stat.trend === 'up' ? 'text-green-400' : 'text-red-400')}>
                  {stat.trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.title}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Trend</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Monthly attendance rate</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyAttendanceTrend.length > 0 ? monthlyAttendanceTrend : [
              { month: 'Jan', rate: 0 },
              { month: 'Feb', rate: 0 },
              { month: 'Mar', rate: 0 },
              { month: 'Apr', rate: 0 },
              { month: 'May', rate: 0 },
              { month: 'Jun', rate: 0 },
            ]}>
              <defs>
                <linearGradient id="hrColorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Area type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={3} fill="url(#hrColorRate)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Today's Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Recent Attendance</h3>
            <button onClick={() => setCurrentPage('attendance')} className="text-xs font-medium" style={{ color: '#3B82F6' }}>View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Employee', 'Department', 'Clock In', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold pb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.slice(0, 5).map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: getAvatarColor(record.employeeName) }}>
                          {getInitials(record.employeeName)}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{record.employeeName}</span>
                      </div>
                    </td>
                    <td className="text-xs py-3" style={{ color: 'var(--text-secondary)' }}>{record.department}</td>
                    <td className="text-xs py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{record.clockIn || '-'}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: record.status === 'present' ? 'rgba(16, 185, 129, 0.1)' : record.status === 'late' ? 'rgba(245, 158, 11, 0.1)' : record.status === 'absent' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: record.status === 'present' ? '#10B981' : record.status === 'late' ? '#F59E0B' : record.status === 'absent' ? '#EF4444' : '#3B82F6' }}>{record.status}</span>
                    </td>
                  </tr>
                ))}
                {attendanceRecords.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No attendance records yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: UserPlus, label: 'Add Employee', color: '#3B82F6', page: 'employees' as const },
                { icon: DollarSign, label: 'Run Payroll', color: '#10B981', page: 'payroll' as const },
                { icon: ClipboardCheck, label: 'Approvals', color: '#F59E0B', page: 'approvals' as const },
                { icon: Target, label: 'Analytics', color: '#8B5CF6', page: 'analytics' as const },
              ].map((action, i) => (
                <button key={i} onClick={() => setCurrentPage(action.page)} className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:scale-105" style={{ background: action.color + '10' }}>
                  <action.icon size={20} style={{ color: action.color }} />
                  <span className="text-[10px] font-medium" style={{ color: action.color }}>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl" style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={18} style={{ color: '#3B82F6' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI Insight</h3>
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
              Start adding employees and attendance data to see AI insights.
            </p>
            <button onClick={() => setCurrentPage('ai-assistant')} className="text-xs font-medium flex items-center gap-1" style={{ color: '#3B82F6' }}>
              <TrendingUp size={12} /> View all insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
