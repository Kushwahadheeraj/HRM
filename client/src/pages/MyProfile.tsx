import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Building2, Calendar, MapPin, Award, Edit3, Save, Camera, Shield, Clock, Star, Loader2, X } from 'lucide-react';
import { employeesAPI, attendanceAPI, leavesAPI, performanceAPI } from '../lib/api';
import type { Employee, AttendanceRecord, Performance } from '../lib/types';

export default function MyProfile() {
  const { currentUser, setCurrentPage } = useApp();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string>('Detecting location...');
  const [showBioModal, setShowBioModal] = useState(false);
  const [tempAvatar, setTempAvatar] = useState<string>('');
  const [tempAddress, setTempAddress] = useState<string>('');

  const isAdministrationUser = currentUser?.department === 'Administration';

  useEffect(() => {
    const fetchData = async () => {
      if (currentUser?.employeeId) {
        setLoading(true);
        try {
          const empRes = await employeesAPI.getByEmployeeId(currentUser.employeeId);
          if (empRes.success && empRes.data) {
            setEmployee(empRes.data);
          }
          if (!isAdministrationUser) {
            const [attRes, leaveRes, perfRes] = await Promise.all([
              attendanceAPI.getByEmployee(currentUser.employeeId),
              leavesAPI.getByEmployee(currentUser.employeeId),
              performanceAPI.getAll({ employeeId: currentUser.employeeId })
            ]);
            if (attRes.success && attRes.data) setAttendanceHistory(attRes.data);
            if (leaveRes.success && leaveRes.data) setLeaveHistory(leaveRes.data);
            if (perfRes.success && perfRes.data) setPerformanceData(perfRes.data);
          }
        } catch (err) {
          console.error('Error fetching profile data:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    // Get user location
    const getLocation = () => {
      if (!navigator.geolocation) {
        setUserLocation('Geolocation not supported');
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://geocode.maps.co/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );
            const data = await response.json();
            if (data.display_name) {
              setUserLocation(data.display_name);
            } else {
              setUserLocation(`Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`);
            }
          } catch (error) {
            setUserLocation(`Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`);
          }
        },
        () => {
          setUserLocation('Location permission denied');
        }
      );
    };
    
    getLocation();
  }, [currentUser?.employeeId, isAdministrationUser]);

  const downloadIdCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const idCardContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee ID Card</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .id-card { background: white; width: 400px; margin: 0 auto; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; }
          .id-header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); padding: 20px; text-align: center; color: white; }
          .id-header h1 { margin: 0; font-size: 24px; }
          .id-header p { margin: 5px 0 0; opacity: 0.9; font-size: 12px; }
          .id-body { padding: 30px; text-align: center; }
          .avatar { width: 100px; height: 100px; border-radius: 50%; background: linear-gradient(135deg, #3B82F6, #1D4ED8); margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; font-weight: bold; }
          .details { text-align: left; }
          .detail-row { display: flex; margin-bottom: 12px; }
          .detail-label { width: 120px; font-weight: bold; color: #666; }
          .detail-value { flex: 1; color: #333; }
          @media print { body { background: white; } }
        </style>
      </head>
      <body>
        <div class="id-card">
          <div class="id-header">
            <h1>Traxale</h1>
            <p>HRM Platform</p>
          </div>
          <div class="id-body">
            <div class="avatar">${currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}</div>
            <div class="details">
              <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${currentUser?.name || 'N/A'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Employee ID:</div>
                <div class="detail-value">${employee?.employeeId || 'N/A'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Department:</div>
                <div class="detail-value">${employee?.department || 'N/A'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Role:</div>
                <div class="detail-value">${employee?.role || 'N/A'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Join Date:</div>
                <div class="detail-value">${employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(idCardContent);
    printWindow.document.close();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  // Calculate stats from real data (only for non-administration users)
  const stats = isAdministrationUser ? [] : (() => {
    const daysPresent = attendanceHistory.filter(r => 
      r.status === 'present' || r.status === 'late' || r.status === 'half-day' || r.status === 'remote'
    ).length;
    
    const leaveTaken = leaveHistory.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.days, 0);
    const totalOvertime = attendanceHistory.reduce((sum, r) => sum + (r.overtime || 0), 0);
    const latestPerformance = performanceData.length > 0 ? performanceData[performanceData.length - 1] : null;
    
    return [
      { label: 'Days Present', value: daysPresent.toString(), total: '/30', color: '#10B981' },
      { label: 'Leave Taken', value: leaveTaken.toString(), total: '/20', color: '#F59E0B' },
      { label: 'Overtime', value: totalOvertime.toFixed(1), total: 'hrs', color: '#3B82F6' },
      { label: 'Performance', value: (latestPerformance?.overallScore || employee?.performance || 0).toString(), total: '%', color: '#8B5CF6' }
    ];
  })();

  const latestPerformance = isAdministrationUser ? null : (performanceData.length > 0 ? performanceData[performanceData.length - 1] : null);
  const performanceItems = isAdministrationUser ? [] : [
    { label: 'Overall Score', value: latestPerformance?.overallScore || employee?.performance || 0, color: '#10B981' },
    { label: 'Teamwork', value: latestPerformance?.teamwork || 0, color: '#3B82F6' },
    { label: 'Innovation', value: latestPerformance?.innovation || 0, color: '#F97316' },
    { label: 'Communication', value: latestPerformance?.communication || 0, color: '#8B5CF6' },
  ];

  const profileFields = [
    { icon: Mail, label: 'Email', value: employee?.email || '', editable: true },
    { icon: Phone, label: 'Phone', value: employee?.phone || currentUser?.phone || '', editable: true },
    { icon: Building2, label: 'Department', value: employee?.department || '', editable: false },
    { icon: User, label: 'Role', value: employee?.role || '', editable: false },
    { icon: Calendar, label: 'Join Date', value: employee?.joinDate ? formatDate(employee.joinDate) : '', editable: false },
    { icon: MapPin, label: 'Current Location', value: userLocation, editable: false },
    { icon: Shield, label: 'Employee ID', value: employee?.employeeId || '', editable: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your personal information</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8, #F97316)' }}>
          <div className="absolute inset-0" style={{ background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        </div>
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', borderColor: 'var(--bg-secondary)' }}>
                {currentUser?.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{currentUser?.name}</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{employee?.role} &middot; {employee?.department}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                </span>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={12} /> Joined {employee?.joinDate ? new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : ''}
                </div>
              </div>
            </div>
            {!isAdministrationUser && latestPerformance && (
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.round(((latestPerformance?.overallScore || employee?.performance || 0)/20)) ? '#F59E0B' : 'transparent'} stroke="#F59E0B" />)}
                <span className="text-sm font-bold ml-1" style={{ color: 'var(--text-primary)' }}>{((latestPerformance?.overallScore || employee?.performance || 0)/20).toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats (only for non-administration users) */}
      {!isAdministrationUser && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 rounded-2xl text-center">
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}<span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{stat.total}</span></p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Personal Information</h3>
          <div className="space-y-4">
            {profileFields.map((field, i) => {
              const Icon = field.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                  <Icon size={18} style={{ color: '#3B82F6' }} />
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{field.label}</p>
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{field.value}</p>
                  </div>
                  {!field.editable && <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)' }}>Fixed</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          {/* Performance (only for non-administration users) */}
          {!isAdministrationUser && (
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Performance</h3>
              <div className="space-y-4">
                {performanceItems.map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: item.value + '%' }} transition={{ duration: 1, delay: i * 0.2 }} className="h-full rounded-full" style={{ background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {!isAdministrationUser && (
                <>
                  <button onClick={() => setCurrentPage('my-leaves')} className="p-3 rounded-xl text-xs font-medium transition-all hover:scale-105 text-center" style={{ background: '#F59E0B12', color: '#F59E0B', border: '1px solid #F59E0B25' }}>
                    Request Leave
                  </button>
                  <button onClick={() => setCurrentPage('my-payroll')} className="p-3 rounded-xl text-xs font-medium transition-all hover:scale-105 text-center" style={{ background: '#3B82F612', color: '#3B82F6', border: '1px solid #3B82F625' }}>
                    View Payslips
                  </button>
                </>
              )}
              <button onClick={() => setShowBioModal(true)} className="p-3 rounded-xl text-xs font-medium transition-all hover:scale-105 text-center" style={{ background: '#10B98112', color: '#10B981', border: '1px solid #10B98125' }}>
                Update Bio
              </button>
              <button onClick={downloadIdCard} className="p-3 rounded-xl text-xs font-medium transition-all hover:scale-105 text-center" style={{ background: '#8B5CF612', color: '#8B5CF6', border: '1px solid #8B5CF625' }}>
                Download ID
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Bio Modal */}
      {showBioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="glass-card rounded-2xl w-full max-w-md p-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Update Bio</h3>
              <button onClick={() => setShowBioModal(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Avatar URL</label>
                <input
                  type="text"
                  value={tempAvatar}
                  onChange={(e) => setTempAvatar(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border-2 focus:outline-none text-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Enter avatar URL"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>Address</label>
                <input
                  type="text"
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-transparent border-2 focus:outline-none text-sm"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  placeholder="Enter address"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border-2"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowBioModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
