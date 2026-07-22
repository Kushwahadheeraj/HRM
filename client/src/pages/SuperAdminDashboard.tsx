import { useState, useEffect } from 'react';
import { useApp } from '../App';
import { authAPI } from '../lib/api';
import { Users, CreditCard, Clock, ChevronDown, ChevronUp, Settings } from 'lucide-react';

interface OrganizationData {
  _id: string;
  name: string;
  isPaid: boolean;
  trialStartDate: string;
  trialEndDate: string;
  paymentDate?: string;
  createdAt: string;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  admin: {
    name: string;
    email: string;
    employeeId: string;
  };
}

export default function SuperAdminDashboard() {
  const { currentUser, setCurrentPage } = useApp();
  const [stats, setStats] = useState<{ freeTrialCount: number; paidCount: number; organizations: OrganizationData[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);

  // Check if current user is super admin
  useEffect(() => {
    if (!currentUser || currentUser.email !== 'dheeraj01072001@gmail.com') {
      setCurrentPage('dashboard');
    }
  }, [currentUser, setCurrentPage]);

  // Fetch organization stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await authAPI.getOrganizationStats();
        if (res.success && res.data) {
          // Transform the data to match expected type
          const transformedData = {
            ...res.data,
            organizations: res.data.organizations.map((org: any) => ({
              ...org,
              plan: org.plan as 'Basic' | 'Pro' | 'Enterprise' | undefined,
            })),
          };
          setStats(transformedData);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && currentUser.email === 'dheeraj01072001@gmail.com') {
      fetchStats();
    }
  }, [currentUser]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Super Admin Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Overview of all organizations
          </p>
        </div>
        <button 
          onClick={() => setCurrentPage('super-admin-pricing')} 
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] hover:shadow-lg" 
          style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
        >
          <Settings size={18} /> Manage Pricing
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
              <Clock size={24} style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Free Trial</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats?.freeTrialCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <CreditCard size={24} style={{ color: '#10B981' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Paid</p>
              <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {stats?.paidCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>All Organizations</h3>
        <div className="space-y-3">
          {stats?.organizations.map((org) => (
            <div 
              key={org._id} 
              className="p-4 rounded-xl border transition-all hover:border-blue-500/30 cursor-pointer"
              style={{ background: 'var(--bg-glass)', borderColor: 'var(--border-color)' }}
              onClick={() => setExpandedOrg(expandedOrg === org._id ? null : org._id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: org.isPaid ? '#10B981' : '#F97316' }}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{org.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin: {org.admin.name}</p>
                    {org.isPaid && org.plan && (
                      <p className="text-xs" style={{ color: '#3B82F6' }}>Plan: {org.plan}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: org.isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(249, 115, 22, 0.1)', color: org.isPaid ? '#10B981' : '#F97316' }}>
                    {org.isPaid ? 'Paid' : 'Free Trial'}
                  </span>
                  {expandedOrg === org._id ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>
              {expandedOrg === org._id && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Admin Email</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{org.admin.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Employee ID</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{org.admin.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Joined Date</p>
                      <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(org.createdAt)}</p>
                    </div>
                    {org.isPaid && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Plan</p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{org.plan || 'Basic'}</p>
                      </div>
                    )}
                    {org.isPaid ? (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Payment Date</p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{org.paymentDate ? formatDate(org.paymentDate) : 'N/A'}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Trial End Date</p>
                        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatDate(org.trialEndDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          {stats?.organizations.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} style={{ color: 'var(--text-muted)', margin: '0 auto', marginBottom: '1rem' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No organizations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}