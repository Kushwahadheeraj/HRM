import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, Clock, Target, Award,
  ArrowUpRight, BarChart3, PieChart as PieIcon, Activity,
  Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend
} from 'recharts';
import { analyticsAPI } from '../lib/api';

// Types
interface DepartmentItem {
  name: string;
  employees: number;
  attendance: number;
  performance: number;
}

interface MonthlyAttendanceTrendItem {
  month: string;
  rate: number;
}

interface ProductivityItem {
  hour: string;
  value: number;
}

interface RadarItem {
  metric: string;
  A: number;
  B: number;
}

interface RevenueItem {
  month: string;
  revenue: number;
  cost: number;
}

export default function Analytics() {
  const [departmentData, setDepartmentData] = useState<DepartmentItem[]>([]);
  const [monthlyAttendanceTrend, setMonthlyAttendanceTrend] = useState<MonthlyAttendanceTrendItem[]>([]);
  const [productivityData, setProductivityData] = useState<ProductivityItem[]>([]);
  const [radarData, setRadarData] = useState<RadarItem[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueItem[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create pie data from departmentData
  const deptPieData = departmentData.map((d, i) => ({
    name: d.name,
    value: d.employees,
    color: ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#F59E0B'][i],
  }));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, deptRes, attTrendRes, radarRes, revenueRes, productivityRes] = await Promise.all([
          analyticsAPI.getDashboardStats(),
          analyticsAPI.getDepartmentStats(),
          analyticsAPI.getAttendanceTrends(),
          analyticsAPI.getRadarData(),
          analyticsAPI.getRevenueData(),
          analyticsAPI.getProductivityData(),
        ]);
        if (statsRes.success) setDashboardStats(statsRes.data);
        if (deptRes.success) setDepartmentData(deptRes.data);
        if (attTrendRes.success) setMonthlyAttendanceTrend(attTrendRes.data);
        if (radarRes.success) setRadarData(radarRes.data);
        if (revenueRes.success) setRevenueData(revenueRes.data);
        if (productivityRes.success) setProductivityData(productivityRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={48} style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  const kpiCards = dashboardStats 
    ? [
        { title: 'Avg. Attendance Rate', value: dashboardStats.avgAttendance, change: dashboardStats.avgAttendanceChange, trend: 'up', icon: Clock, color: '#10B981' },
        { title: 'Employee Satisfaction', value: dashboardStats.employeeSatisfaction, change: dashboardStats.employeeSatisfactionChange, trend: 'up', icon: Award, color: '#3B82F6' },
        { title: 'Productivity Index', value: dashboardStats.productivityIndex, change: dashboardStats.productivityChange, trend: 'down', icon: Target, color: '#F97316' },
        { title: 'Retention Rate', value: dashboardStats.retentionRate, change: dashboardStats.retentionChange, trend: 'up', icon: Users, color: '#8B5CF6' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>HR Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>AI-powered insights and comprehensive workforce analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {['7D', '30D', '90D', '1Y'].map((t, i) => (
            <button key={t} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{
              background: i === 1 ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: i === 1 ? '#3B82F6' : 'var(--text-muted)',
              border: i === 1 ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent',
            }}>{t}</button>
          ))}
        </div>
      </div>

      {kpiCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card glass-card-hover p-5 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}15` }}>
                    <Icon size={20} style={{ color: kpi.color }} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-semibold ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.trend === 'up' ? <ArrowUpRight size={14} /> : <TrendingDown size={14} />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{kpi.title}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Attendance Trend</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>6-month attendance rate tracking</p>
          {monthlyAttendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyAttendanceTrend}>
                <defs>
                  <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} domain={[80, 100]} />
                <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={3} fill="url(#colorAtt)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data available</div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Performance Radar</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Current vs Previous quarter</p>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="metric" stroke="rgba(255,255,255,0.5)" fontSize={11} />
                <PolarRadiusAxis stroke="rgba(255,255,255,0.1)" fontSize={10} />
                <Radar name="Current" dataKey="A" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Previous" dataKey="B" stroke="#F97316" fill="#F97316" fillOpacity={0.1} strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data available</div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Revenue vs HR Cost</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Monthly comparison (in thousands)</p>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', r: 4 }} />
                <Line type="monotone" dataKey="cost" stroke="#EF4444" strokeWidth={3} dot={{ fill: '#EF4444', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data available</div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Department Distribution</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Employee count by department</p>
          {deptPieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={deptPieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" strokeWidth={0}>
                    {deptPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {deptPieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data available</div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Department Performance Overview</h3>
        {departmentData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Department', 'Employees', 'Attendance Rate', 'Performance', 'Status'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold pb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {departmentData.map((dept, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-4 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{dept.name}</td>
                    <td className="py-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{dept.employees}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
                          <div className="h-full rounded-full" style={{ width: `${dept.attendance}%`, background: dept.attendance >= 90 ? '#10B981' : '#F59E0B' }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{dept.attendance}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
                          <div className="h-full rounded-full" style={{ width: `${dept.performance}%`, background: dept.performance >= 90 ? '#3B82F6' : '#F59E0B' }} />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{dept.performance}%</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{
                        background: dept.attendance >= 90 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: dept.attendance >= 90 ? '#10B981' : '#F59E0B',
                      }}>
                        {dept.attendance >= 90 ? 'Excellent' : 'Good'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No data available</div>
        )}
      </div>
    </div>
  );
}
