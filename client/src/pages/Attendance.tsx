import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, MapPin,
  Fingerprint, QrCode, Camera, Wifi, Calendar, RefreshCw, Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getInitials, getAvatarColor } from '../lib/data';
import { attendanceAPI } from '../lib/api';
import { useApp } from '../App';
import { AttendanceRecord } from '../lib/types';

// Type for heatmap data
interface HeatmapItem {
  day: string;
  hour: string;
  value: number;
}

const methods = [
  { icon: Camera, label: 'Face ID', desc: 'AI recognition', color: '#3B82F6' },
  { icon: MapPin, label: 'GPS', desc: 'Location based', color: '#10B981' },
  { icon: QrCode, label: 'QR Code', desc: 'Scan to clock in', color: '#F97316' },
  { icon: Fingerprint, label: 'Biometric', desc: 'Fingerprint scan', color: '#8B5CF6' },
];

export default function Attendance() {
  const [clockedIn, setClockedIn] = useState(false);
  const [clockTime, setClockTime] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapItem[]>([]);
  const [hourlyData, setHourlyData] = useState<{ time: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useApp();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch data on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch today's attendance for the log
        let attendanceRes;
        if (currentUser?.role === 'team_manager') {
          attendanceRes = await attendanceAPI.getTeamAttendance(currentUser.name, { date: today });
        } else {
          attendanceRes = await attendanceAPI.getByDate(today);
        }
        if (attendanceRes.success && attendanceRes.data) {
          setAttendanceRecords(attendanceRes.data);
        }
        
        // Fetch clock-in distribution
        const distributionRes = await attendanceAPI.getClockInDistribution(today);
        if (distributionRes.success && distributionRes.data) {
          setHourlyData(distributionRes.data);
        }
        
        // Fetch heatmap data
        const heatmapRes = await attendanceAPI.getHeatmap();
        if (heatmapRes.success && heatmapRes.data) {
          setHeatmapData(heatmapRes.data);
        }
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [today, currentUser]);

  const handleClockIn = () => {
    setClockedIn(true);
    setClockTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Smart Attendance</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Real-time attendance tracking with AI-powered insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Wifi size={14} style={{ color: '#10B981' }} />
            <span className="text-xs font-medium" style={{ color: '#10B981' }}>Live Sync Active</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center" style={{ border: clockedIn ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 animate-pulse-glow" style={{ background: clockedIn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
            <Clock size={36} style={{ color: clockedIn ? '#10B981' : '#3B82F6' }} />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            {clockedIn ? 'Clocked In' : 'Clock In Now'}
          </h2>
          <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
            {clockedIn ? 'Since ' + clockTime : 'Choose a method to clock in'}
          </p>
          <p className="text-3xl font-black font-mono mb-6 gradient-text">
            {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <button onClick={clockedIn ? () => setClockedIn(false) : handleClockIn} className="w-full py-4 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]" style={{ background: clockedIn ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
            {clockedIn ? 'Clock Out' : 'Clock In'}
          </button>
          {clockedIn && <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}><MapPin size={12} /> San Francisco Office</div>}
        </div>

        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Attendance Methods</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Multiple ways to mark your attendance</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {methods.map((method, i) => {
              const Icon = method.icon;
              return (
                <button key={i} onClick={() => setSelectedMethod(i)} className="p-4 rounded-xl text-center transition-all hover:scale-105" style={{ background: selectedMethod === i ? method.color + '15' : 'var(--bg-glass)', border: selectedMethod === i ? '1px solid ' + method.color + '40' : '1px solid var(--border-color)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: method.color + '15' }}>
                    <Icon size={24} style={{ color: method.color }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{method.label}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{method.desc}</p>
                </button>
              );
            })}
          </div>
          <h4 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Clock-In Distribution</h4>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Heatmap</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Activity intensity by day and hour</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-2 pl-12">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex-1 text-center text-[10px]" style={{ color: 'var(--text-muted)' }}>{i + 7}:00</div>
              ))}
            </div>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="flex items-center gap-2 mb-1">
                <span className="w-10 text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>{day}</span>
                <div className="flex gap-1 flex-1">
                  {Array.from({ length: 12 }, (_, hourIdx) => {
                    const val = heatmapData.find(h => h.day === day && h.hour === (hourIdx + 7) + ':00')?.value || 0;
                    const intensity = Math.min(val / 90, 1);
                    return (
                      <div key={hourIdx} className="flex-1 h-8 rounded-sm transition-all hover:scale-110 cursor-pointer" style={{ background: intensity > 0 ? 'rgba(59, 130, 246, ' + (intensity * 0.8 + 0.1) + ')' : 'rgba(255,255,255,0.02)' }} title={day + ' ' + (hourIdx + 7) + ':00 - ' + val + '%'} />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Less</span>
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((v, i) => (
            <div key={i} className="w-4 h-4 rounded-sm" style={{ background: 'rgba(59, 130, 246, ' + v + ')' }} />
          ))}
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>More</span>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Today's Attendance Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Employee', 'Department', 'Clock In', 'Clock Out', 'Overtime', 'Status', 'Method'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold pb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
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
                  <td className="text-xs py-3 font-mono" style={{ color: 'var(--text-secondary)' }}>{record.clockOut || '-'}</td>
                  <td className="text-xs py-3" style={{ color: (record.overtime || 0) > 0 ? '#F97316' : 'var(--text-muted)' }}>{(record.overtime || 0) > 0 ? '+' + (record.overtime || 0) + 'h' : '-'}</td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: record.status === 'present' ? 'rgba(16, 185, 129, 0.1)' : record.status === 'late' ? 'rgba(245, 158, 11, 0.1)' : record.status === 'absent' ? 'rgba(239, 68, 68, 0.1)' : record.status === 'remote' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)', color: record.status === 'present' ? '#10B981' : record.status === 'late' ? '#F59E0B' : record.status === 'absent' ? '#EF4444' : record.status === 'remote' ? '#3B82F6' : '#8B5CF6' }}>{record.status}</span>
                  </td>
                  <td className="text-xs py-3 capitalize" style={{ color: 'var(--text-muted)' }}>{record.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
