import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Check, X, MapPin, Clock, User } from 'lucide-react';
import { attendanceAPI } from '../lib/api';
import { AttendanceRecord, User as UserType } from '../lib/types';

export default function AttendanceApprovals() {
  const { currentUser } = useApp();
  const [loading, setLoading] = useState(true);
  const [pendingApprovals, setPendingApprovals] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');

  // Fetch pending approvals
  const fetchApprovals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceAPI.getPendingApprovals();
      if (res.success && res.data) {
        setPendingApprovals(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      setError('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Handle approve
  const handleApprove = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      await attendanceAPI.approve(id, currentUser.id);
      await fetchApprovals();
    } catch (err) {
      console.error('Failed to approve:', err);
      setError('Failed to approve attendance');
    }
  };

  // Handle reject
  const handleReject = async (id: string) => {
    if (!currentUser?.id) return;
    try {
      await attendanceAPI.reject(id, currentUser.id, 'Attendance rejected by HR');
      await fetchApprovals();
    } catch (err) {
      console.error('Failed to reject:', err);
      setError('Failed to reject attendance');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Attendance Approvals</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Review and approve pending attendance requests</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {pendingApprovals.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--bg-glass)' }}>
            <Check size={32} style={{ color: 'var(--text-muted)' }} />
          </div>
          <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No Pending Approvals</h3>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All attendance requests have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingApprovals.map((attendance) => (
            <div key={attendance.id || attendance._id} className="glass-card p-6 rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--bg-glass)' }}>
                      <User size={20} style={{ color: 'var(--text-primary)' }} />
                    </div>
                    <div>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{attendance.employeeName}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ID: {attendance.employeeId}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Date</p>
                      <p style={{ color: 'var(--text-primary)' }}>{new Date(attendance.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Check-in Time</p>
                      <p className="flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                        <Clock size={14} />
                        {attendance.clockIn}
                      </p>
                    </div>
                    {attendance.location && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Location</p>
                        <p className="flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                          <MapPin size={14} />
                          {attendance.location.latitude.toFixed(4)}, {attendance.location.longitude.toFixed(4)}
                        </p>
                      </div>
                    )}
                  </div>

                  {attendance.notes && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notes</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{attendance.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleReject(attendance.id || attendance._id!)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#EF4444',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    <X size={16} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(attendance.id || attendance._id!)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                    }}
                  >
                    <Check size={16} />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
