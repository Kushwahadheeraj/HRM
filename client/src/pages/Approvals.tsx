import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { CheckCircle2, XCircle, Clock, Calendar, MessageSquare, Bell, UserCheck } from 'lucide-react';
import { leavesAPI } from '../lib/api';
import { getInitials, getAvatarColor } from '../lib/data';
import { LeaveRequest } from '../lib/types';

export default function Approvals() {
  const { currentUser } = useApp();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tab, setTab] = useState<'pending' | 'processed'>('pending');
  const [loading, setLoading] = useState(true);

  const fetchLeaveRequests = async () => {
    try {
      const res = await leavesAPI.getAll();
      if (res.success && res.data) {
        setLeaveRequests(res.data);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const isHR = currentUser?.role === 'hr_manager';
  const pendingItems = isHR
    ? leaveRequests.filter(r => r.status === 'pending')
    : leaveRequests.filter(r => r.status === 'pending' && r.department === 'Engineering');

  const processedItems = leaveRequests.filter(r => r.status === 'approved' || r.status === 'rejected');

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await leavesAPI.updateStatus(id, action, currentUser?.role);
      // Refresh the list
      fetchLeaveRequests();
    } catch (error) {
      console.error('Error updating leave status:', error);
    }
  };

  const stats = [
    { label: 'Pending', value: pendingItems.length, icon: Clock, color: '#F59E0B' },
    { label: 'Approved', value: leaveRequests.filter(p => p.status === 'approved').length, icon: CheckCircle2, color: '#10B981' },
    { label: 'Rejected', value: leaveRequests.filter(p => p.status === 'rejected').length, icon: XCircle, color: '#EF4444' },
    { label: 'Total Processed', value: processedItems.length, icon: UserCheck, color: '#3B82F6' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#3B82F6' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Approvals</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {isHR ? 'Review and process all leave requests' : 'Review leave requests from your team members'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <Bell size={14} style={{ color: '#F59E0B' }} />
          <span className="text-xs font-medium" style={{ color: '#F59E0B' }}>{pendingItems.length} pending</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: s.color + '15' }}>
                  <Icon size={18} style={{ color: s.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2">
        <button onClick={() => setTab('pending')} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: tab === 'pending' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-glass)', color: tab === 'pending' ? '#3B82F6' : 'var(--text-muted)', border: tab === 'pending' ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--border-color)' }}>
          Pending ({pendingItems.length})
        </button>
        <button onClick={() => setTab('processed')} className="px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{ background: tab === 'processed' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-glass)', color: tab === 'processed' ? '#10B981' : 'var(--text-muted)', border: tab === 'processed' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)' }}>
          Processed ({processedItems.length})
        </button>
      </div>

      {/* Pending Requests */}
      {tab === 'pending' && (
        <div className="space-y-4">
          {pendingItems.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: '#10B981' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>All Caught Up!</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pending requests to review</p>
            </div>
          ) : (
            pendingItems.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card glass-card-hover p-5 rounded-2xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(req.employeeName) }}>
                      {getInitials(req.employeeName)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{req.employeeName}</h3>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.department} &middot; {req.type} leave</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {req.startDate} to {req.endDate}</span>
                    <span className="font-semibold">{req.days} days</span>
                  </div>
                  {isHR && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        const reqId = req.id || req._id || '';
                        reqId && handleAction(reqId, 'approved')
                      }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button onClick={() => {
                        const reqId = req.id || req._id || '';
                        reqId && handleAction(reqId, 'rejected')
                      }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
                {req.reason && (
                  <div className="mt-3 pt-3 flex items-start gap-2" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <MessageSquare size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{req.reason}</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Processed */}
      {tab === 'processed' && (
        <div className="space-y-3">
          {processedItems.length === 0 ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Clock size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Processed Items</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Approve or reject requests to see them here</p>
            </div>
          ) : (
            processedItems.map((req, i) => (
              <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(req.employeeName) }}>
                  {getInitials(req.employeeName)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{req.employeeName} - {req.type} leave</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.startDate} to {req.endDate}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: req.status === 'approved' ? '#10B981' : '#EF4444' }}>{req.status}</span>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
