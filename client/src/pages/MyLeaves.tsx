import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { motion } from 'framer-motion';
import { Calendar, Plus, X, CheckCircle2, XCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { leavesAPI } from '../lib/api';

// Type for My Leaves
interface MyLeave {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
}

interface LeaveBalance {
  type: string;
  used: number;
  total: number;
  color: string;
}

const getLeaveTypeColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    annual: '#3B82F6',
    sick: '#EF4444',
    personal: '#F59E0B',
    maternity: '#EC4899',
    paternity: '#6366F1',
    remote: '#8B5CF6'
  };
  return colorMap[type] || '#3B82F6';
};

const getLeaveTypeName = (type: string): string => {
  const typeMap: Record<string, string> = {
    annual: 'Annual Leave',
    sick: 'Sick Leave',
    personal: 'Personal Leave',
    maternity: 'Maternity Leave',
    paternity: 'Paternity Leave',
    remote: 'Remote Days'
  };
  return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
};

export default function MyLeaves() {
  const { currentUser } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [leaves, setLeaves] = useState<MyLeave[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [formData, setFormData] = useState({ type: 'annual', startDate: '', endDate: '', reason: '' });
  const [loading, setLoading] = useState(true);

  const fetchLeaveData = async () => {
    if (!currentUser?.employeeId) return;
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        leavesAPI.getByEmployee(currentUser.employeeId),
        leavesAPI.getBalance(currentUser.employeeId)
      ]);

      if (leavesRes.success && leavesRes.data) {
        const transformed = leavesRes.data.map((item: any) => ({
          id: item.id || item._id,
          type: getLeaveTypeName(item.type),
          startDate: item.startDate,
          endDate: item.endDate,
          days: item.days,
          reason: item.reason,
          status: item.status
        }));
        setLeaves(transformed);
      }

      if (balanceRes.success && balanceRes.data) {
        const transformed = balanceRes.data.map((item: any) => ({
          type: getLeaveTypeName(item.type),
          used: item.used,
          total: item.total,
          color: getLeaveTypeColor(item.type)
        }));
        setLeaveBalance(transformed);
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveData();
  }, [currentUser?.employeeId]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.employeeId) return;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    try {
      const res = await leavesAPI.create({
        employeeId: currentUser.employeeId,
        employeeName: currentUser.name,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        days: days,
        reason: formData.reason,
        department: currentUser.department
      });

      if (res.success) {
        await fetchLeaveData();
        setShowForm(false);
        setFormData({ type: 'annual', startDate: '', endDate: '', reason: '' });
      }
    } catch (error) {
      console.error('Error applying leave:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Leaves</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Apply for leave and track your balance</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {leaveBalance.map((lb, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{lb.type}</span>
              <span className="text-xs font-bold" style={{ color: lb.color }}>{lb.total - lb.used} left</span>
            </div>
            <p className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{lb.used}<span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/{lb.total}</span></p>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: (lb.used / lb.total * 100) + '%', background: lb.color }} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Apply Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Apply for Leave</h3>
            <form onSubmit={handleApply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Leave Type</label>
                <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="annual" style={{ color: 'black' }}>Annual Leave</option>
                  <option value="sick" style={{ color: 'black' }}>Sick Leave</option>
                  <option value="personal" style={{ color: 'black' }}>Personal Leave</option>
                  <option value="maternity" style={{ color: 'black' }}>Maternity Leave</option>
                  <option value="paternity" style={{ color: 'black' }}>Paternity Leave</option>
                  <option value="remote" style={{ color: 'black' }}>Remote Days</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Start Date</label>
                  <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>End Date</label>
                  <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Reason</label>
                <textarea rows={3} value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Enter reason for leave..." className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
              </div>
              <button type="submit" className="w-full py-3.5 rounded-xl text-white font-semibold transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>Submit Request</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Leave History */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Leave History</h3>
        <div className="space-y-3">
          {leaves.map((leave, i) => (
            <motion.div key={leave.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl transition-all hover:bg-white/5" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: leave.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : leave.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                  {leave.status === 'approved' ? <CheckCircle2 size={20} style={{ color: '#10B981' }} /> : leave.status === 'pending' ? <Clock size={20} style={{ color: '#F59E0B' }} /> : <XCircle size={20} style={{ color: '#EF4444' }} />}
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{leave.type}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{leave.startDate} - {leave.endDate} &middot; {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{leave.reason}</span>
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: leave.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : leave.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: leave.status === 'approved' ? '#10B981' : leave.status === 'pending' ? '#F59E0B' : '#EF4444' }}>{leave.status}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
