import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { useApp } from '../App';
import {
  Users, CheckCircle2, Award, Calendar,
  ClipboardCheck, Clock
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { getInitials, getAvatarColor } from '../lib/data';
import { teamManagersAPI } from '../lib/api';
import { Employee } from '../lib/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function TeamManagerDashboard() {
  const { setCurrentPage, currentUser } = useApp();
  const [employees, setEmployees] = useState<Employee[]>([]);
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{greeting}, {currentUser?.name.split(' ')[0]}! 👋</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your team overview for today</p>
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
          </div>
        </div>
      </div>

      {/* Weekly Chart */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Weekly Team Attendance</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={attendanceWeeklyData}>
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
