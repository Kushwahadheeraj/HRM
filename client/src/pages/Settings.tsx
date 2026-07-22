import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Smartphone, Monitor, Moon, Sun, Check, Save } from 'lucide-react';
import { authAPI } from '../lib/api';
import { SuperAdmin, OrganizationStatus, ThemeMode } from '../lib/types';

const tabs = ['Notifications', 'Security', 'Appearance', 'Integrations'];

// Fallback super admin data for if API fails
const fallbackSuperAdmin: SuperAdmin = {
  _id: 'super-admin-id',
  id: 'super-admin-id',
  name: 'Dheeraj Kushwaha',
  email: 'dheeraj01072001@gmail.com',
  role: 'super_admin',
  roleLabel: 'Super Administrator',
  department: 'Administration',
  avatar: '',
  employeeId: 'TRX-SUPER-ADMIN',
  phone: '8299301972',
  theme: 'dark' as ThemeMode,
  accentColor: '#3B82F6',
  notifications: {
    email: true,
    push: true,
    leaveRequests: true,
    attendanceAlerts: false,
    aiInsights: true
  },
  integrations: {
    slack: true,
    googleWorkspace: true,
    microsoftTeams: false,
    zoom: true,
    stripe: true
  },
  plan: 'Professional',
  storageUsed: 2.4,
  storageTotal: 10,
  lastLogin: new Date()
};

export default function Settings() {
  const { theme, toggleTheme } = useApp();
  const [activeTab, setActiveTab] = useState('Notifications');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [superAdminData, setSuperAdminData] = useState<SuperAdmin | null>(null);
  const [formData, setFormData] = useState<SuperAdmin | null>(null);
  const [organizationStatus, setOrganizationStatus] = useState<OrganizationStatus | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Function to get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'hr_manager':
        return 'HR Manager';
      case 'team_manager':
        return 'Team Manager';
      case 'employee':
        return 'Employee';
      case 'super_admin':
        return 'Admin';
      default:
        return 'User';
    }
  };

  // Fetch super admin data and organization status on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [userRes, orgRes] = await Promise.all([
          authAPI.getSuperAdmin(),
          authAPI.getOrganizationStatus()
        ]);
        
        if (userRes.success && userRes.data) {
          setSuperAdminData(userRes.data);
          setFormData(userRes.data);
        } else {
          setSuperAdminData(fallbackSuperAdmin);
          setFormData(fallbackSuperAdmin);
        }
        
        if (orgRes.success && orgRes.data) {
          setOrganizationStatus(orgRes.data);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setSuperAdminData(fallbackSuperAdmin);
        setFormData(fallbackSuperAdmin);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Format last login
  const formatLastLogin = (date?: Date | string) => {
    if (!date) return 'Recently';
    const d = new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
    });
  };

  // Handle nested field changes (notifications/integrations/theme/accentColor)
  const handleNestedChange = (category: 'notifications' | 'integrations' | 'theme' | 'accentColor', key: string, value: any) => {
    setFormData(prev => {
      if (!prev) return prev;
      if (category === 'theme' || category === 'accentColor') {
        return {
          ...prev,
          [category]: value,
        };
      }
      return {
        ...prev,
        [category]: {
          ...prev[category as 'notifications' | 'integrations'],
          [key]: value
        },
      };
    });
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save settings
  const handleSave = async () => {
    if (!formData || !formData._id) return;

    // Validate password change if fields are filled
    if (passwordData.newPassword || passwordData.currentPassword) {
      if (!passwordData.currentPassword) {
        setError('Please enter your current password');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New password and confirm password do not match');
        return;
      }
    }

    setError('');
    setSaved(false);
    try {
      const updatePayload = { ...formData };
      
      // Add password to payload if being changed
      if (passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword) {
        updatePayload.password = passwordData.newPassword;
      }

      const res = await authAPI.updateSettings(formData._id, updatePayload);
      if (res.success && res.data) {
        setSuperAdminData(res.data);
        setFormData(res.data);
        setSaved(true);
        // Reset password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save changes');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!superAdminData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your account and application preferences</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: activeTab === tab ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
              color: activeTab === tab ? '#3B82F6' : 'var(--text-muted)',
              border: activeTab === tab ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid transparent'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Notification Preferences</h3>
              {[
                { key: 'email', title: 'Email Notifications', desc: 'Receive email alerts for important updates' },
                { key: 'push', title: 'Push Notifications', desc: 'Browser push notifications for real-time alerts' },
                { key: 'leaveRequests', title: 'Leave Request Alerts', desc: 'Get notified for new leave requests' },
                { key: 'attendanceAlerts', title: 'Attendance Alerts', desc: 'Alerts for late arrivals and absences' },
                { key: 'aiInsights', title: 'AI Insights Digest', desc: 'Weekly AI-generated HR insights' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData?.notifications?.[item.key] ?? false}
                      onChange={(e) => handleNestedChange('notifications', item.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 after:bg-white" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'Security' && (
            <div className="glass-card p-6 rounded-2xl space-y-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <h4 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Active Sessions</h4>
                <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <Monitor size={16} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Chrome on MacOS</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>San Francisco - Active now</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-green-400">Current</span>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'Appearance' && (
            <div className="glass-card p-6 rounded-2xl space-y-6">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Appearance</h3>
              <div>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Theme</p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      if (theme !== 'dark') toggleTheme();
                      handleNestedChange('theme', 'theme', 'dark');
                    }}
                    className="p-6 rounded-2xl text-center transition-all"
                    style={{
                      background: '#0A0F1E',
                      border: (formData?.theme || theme) === 'dark' ? '2px solid #3B82F6' : '2px solid transparent'
                    }}
                  >
                    <Moon size={24} className="mx-auto mb-2 text-blue-400" />
                    <p className="text-sm font-semibold text-white">Dark Mode</p>
                    {(formData?.theme || theme) === 'dark' && <Check size={16} className="mx-auto mt-2 text-blue-400" />}
                  </button>
                  <button
                    onClick={() => {
                      if (theme !== 'light') toggleTheme();
                      handleNestedChange('theme', 'theme', 'light');
                    }}
                    className="p-6 rounded-2xl text-center transition-all bg-white"
                    style={{
                      border: (formData?.theme || theme) === 'light' ? '2px solid #3B82F6' : '2px solid transparent'
                    }}
                  >
                    <Sun size={24} className="mx-auto mb-2 text-orange-500" />
                    <p className="text-sm font-semibold text-gray-900">Light Mode</p>
                    {(formData?.theme || theme) === 'light' && <Check size={16} className="mx-auto mt-2 text-blue-500" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Accent Color</p>
                <div className="flex items-center gap-3">
                  {['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EF4444', '#EC4899'].map((color, i) => (
                    <button
                      key={i}
                      onClick={() => handleNestedChange('accentColor', 'accentColor', color)}
                      className="w-10 h-10 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                      style={{
                        background: color,
                        boxShadow: (formData?.accentColor || '#3B82F6') === color ? '0 0 0 2px var(--bg-primary), 0 0 0 4px ' + color : 'none'
                      }}
                    >
                      {(formData?.accentColor || '#3B82F6') === color && <Check size={18} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'Integrations' && (
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Integrations</h3>
              {[
                { key: 'slack', name: 'Slack', desc: 'Send notifications to Slack channels', icon: '💬' },
                { key: 'googleWorkspace', name: 'Google Workspace', desc: 'Sync calendars and contacts', icon: '📅' },
                { key: 'microsoftTeams', name: 'Microsoft Teams', desc: 'Team communication', icon: '👥' },
                { key: 'zoom', name: 'Zoom', desc: 'Video conferencing for interviews', icon: '📹' },
                { key: 'stripe', name: 'Stripe', desc: 'Payment processing for payroll', icon: '💳' },
              ].map((integration, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{integration.icon}</span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{integration.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{integration.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData?.integrations?.[integration.key] ?? false}
                      onChange={(e) => handleNestedChange('integrations', integration.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500 after:bg-white" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }} />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Account Info</h3>
            <div className="space-y-3">
              {[
                { 
                  label: 'Plan', 
                  value: organizationStatus?.isPaid ? 'Paid' : 'Free Trial',
                  color: organizationStatus?.isPaid ? '#10B981' : '#F97316'
                },
                { label: 'Role', value: getRoleDisplayName(superAdminData.role) || 'User' },
                { label: 'Member Since', value: superAdminData.createdAt ? new Date(superAdminData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A' },
                { label: 'Last Login', value: formatLastLogin(superAdminData.lastLogin) },
                { label: 'Storage', value: `${superAdminData.storageUsed || 2.4} GB / ${superAdminData.storageTotal || 10} GB` },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span className="text-xs font-medium" style={{ color: item.color || 'var(--text-primary)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{
              background: saved ? '#10B981' : 'linear-gradient(135deg, #3B82F6, #2563EB)'
            }}
          >
            {saved ? (
              <>
                <Check size={16} /> Saved!
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
