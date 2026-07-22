import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, XCircle, Clock, Plus } from 'lucide-react';
import { getInitials, getAvatarColor } from '../lib/data';
import { leavesAPI } from '../lib/api';
import { useApp } from '../App';
import { LeaveRequest } from '../lib/types';

const leaveTypes = [
  { type: 'annual', label: 'Annual', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
  { type: 'sick', label: 'Sick', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
  { type: 'personal', label: 'Personal', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
  { type: 'maternity', label: 'Maternity', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' },
  { type: 'paternity', label: 'Paternity', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' },
  { type: 'remote', label: 'Remote', color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
];


export default function LeaveManagement() {
  const [filter, setFilter] = useState('all');
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const { currentUser } = useApp();

  const fetchLeaves = async () => {
    try {
      let res;
      if (currentUser?.role === 'team_manager') {
        res = await leavesAPI.getTeamLeaves(currentUser.name);
      } else {
        res = await leavesAPI.getAll();
      }
      if (res.success && res.data) setRequests(res.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary from real requests
  const summaryCards = [
    { title: 'Total Requests', value: requests.length.toString(), icon: Calendar, color: '#3B82F6' },
    { title: 'Pending', value: requests.filter(r => r.status === 'pending').length.toString(), icon: Clock, color: '#F59E0B' },
    { title: 'Approved', value: requests.filter(r => r.status === 'approved').length.toString(), icon: CheckCircle2, color: '#10B981' },
    { title: 'Rejected', value: requests.filter(r => r.status === 'rejected').length.toString(), icon: XCircle, color: '#EF4444' },
  ];

  useEffect(() => {
    fetchLeaves();
  }, [currentUser]);

  const handleApprove = async (id: string) => {
    try {
      await leavesAPI.updateStatus(id, 'approved', currentUser?.role);
      fetchLeaves();
    } catch (error) {
      console.error('Error approving leave:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await leavesAPI.updateStatus(id, 'rejected', currentUser?.role);
      fetchLeaves();
    } catch (error) {
      console.error('Error rejecting leave:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Leave Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage and approve employee leave requests</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: card.color + '15' }}>
                <Icon size={20} style={{ color: card.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.title}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {['all', 'pending', 'approved', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className="px-4 py-2 rounded-xl text-xs font-medium transition-all capitalize" style={{ background: filter === f ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-glass)', color: filter === f ? '#3B82F6' : 'var(--text-muted)', border: filter === f ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--border-color)' }}>
            {f === 'all' ? 'All Requests' : f}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((req, i) => {
          const leaveType = leaveTypes.find(lt => lt.type === req.type) || leaveTypes[0];
          return (
            <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-5 rounded-2xl transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(req.employeeName) }}>
                    {getInitials(req.employeeName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{req.employeeName}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.department}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: leaveType.bg }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: leaveType.color }} />
                    <span className="font-medium capitalize" style={{ color: leaveType.color }}>{req.type}</span>
                  </div>
                  <span>{req.startDate} to {req.endDate}</span>
                  <span className="font-semibold">{req.days || 0} day{(req.days || 0) > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase" style={{ background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: req.status === 'approved' ? '#10B981' : req.status === 'rejected' ? '#EF4444' : '#F59E0B' }}>{req.status}</span>
                  {req.status === 'pending' && currentUser?.role === 'hr_manager' && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => { const id = req.id || req._id || ''; id && handleApprove(id); }} className="p-2 rounded-lg transition-all hover:scale-110 hover:bg-green-500/10" style={{ color: '#10B981' }}><CheckCircle2 size={18} /></button>
                      <button onClick={() => { const id = req.id || req._id || ''; id && handleReject(id); }} className="p-2 rounded-lg transition-all hover:scale-110 hover:bg-red-500/10" style={{ color: '#EF4444' }}><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </div>
              {req.reason && <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Reason: <span style={{ color: 'var(--text-secondary)' }}>{req.reason}</span></p></div>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
