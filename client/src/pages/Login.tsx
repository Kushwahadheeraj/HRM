import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { ArrowLeft, Shield, Users, User, ChevronRight, Lock, Eye, EyeOff } from 'lucide-react';
import { UserRole } from '../lib/types';
import { authAPI } from '../lib/api';

const roles = [
  {
    role: 'hr_manager' as UserRole,
    title: 'HR Manager',
    desc: 'Full platform access: employee management, payroll, recruitment, analytics, and AI tools.',
    icon: Shield,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    features: ['All Employees', 'Payroll & Analytics', 'Recruitment', 'AI Assistant', 'Settings'],
  },
  {
    role: 'team_manager' as UserRole,
    title: 'Team Manager',
    desc: 'Manage your team: attendance monitoring, leave approvals, performance reviews, and scheduling.',
    icon: Users,
    color: '#F97316',
    gradient: 'linear-gradient(135deg, #F97316, #EA580C)',
    features: ['Team Dashboard', 'Approve Leaves', 'Performance Reviews', 'Shift Scheduling', 'Team Analytics'],
  },
  {
    role: 'employee' as UserRole,
    title: 'Employee',
    desc: 'Clock in/out, apply for leave, view salary slips, check attendance history, and manage your profile.',
    icon: User,
    color: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981, #059669)',
    features: ['Clock In/Out', 'Apply Leave', 'Salary Slips', 'Attendance History', 'My Profile'],
  },
];

export default function Login() {
  const { login: appLogin, setCurrentPage } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'role' | 'login' | 'register'>('role');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('login');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // console.log('=== Login handleLogin ===');
      // console.log('Login attempt with:', { email: loginData.email });
      const res = await authAPI.login(loginData);
      // console.log('Login API full response:', res);
      // console.log('Login response data:', res.data);
      if (res.data) {
        // console.log('Login response data keys:', Object.keys(res.data));
        // console.log('Login response data.organizationId:', (res.data as any).organizationId);
      }
      if (res.success && res.data) {
        const user = (res.data as any).user || res.data;
        // Ensure both _id and id are present!
        if (user._id && !user.id) user.id = user._id;
        if (user.id && !user._id) user._id = user.id;
        // console.log('Login user after ensuring _id and id:', user);
        appLogin(user as any);
      }
    } catch (error) {
      // console.error('Login failed:', error);
      alert('Login failed! Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register({ ...registerData, role: selectedRole || 'employee' });
      if (res.success) {
        alert('Registration successful! Please login.');
        setStep('login');
      }
    } catch (error) {
      alert('Registration failed! Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = roles.find(r => r.role === selectedRole);

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 hero-grid opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: '#3B82F6' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.07] blur-[100px]" style={{ background: '#F97316' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-[0.04] blur-[120px]" style={{ background: 'linear-gradient(135deg, #3B82F6, #F97316)' }} />
        {[...Array(12)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 rounded-full" style={{ background: i % 2 === 0 ? '#3B82F6' : '#F97316', left: (10 + Math.random() * 80) + '%', top: (10 + Math.random() * 80) + '%' }} animate={{ y: [0, -20, 0], opacity: [0.1, 0.6, 0.1] }} transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }} />
        ))}
      </div>

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative z-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} className="max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center neon-glow" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <div>
              <h1 className="text-2xl font-black gradient-text">Traxale HRM</h1>
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Track. Manage. Scale.</p>
            </div>
          </div>
          <h2 className="text-4xl font-black mb-6 leading-tight" style={{ color: 'var(--text-primary)' }}>
            Welcome to the<br /><span className="gradient-text">Future of HR</span>
          </h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Select your role to access a personalized dashboard built for how you work.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[{ v: '248', l: 'Employees' }, { v: '93%', l: 'Attendance' }, { v: '4.8', l: 'Rating' }].map((s, i) => (
              <div key={i} className="glass-card p-4 rounded-xl text-center">
                <p className="text-xl font-black gradient-text">{s.v}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-lg">
          <button onClick={() => step === 'login' || step === 'register' ? setStep('role') : setCurrentPage('landing')} className="flex items-center gap-2 mb-6 text-sm font-medium transition-colors hover:text-electric" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={16} /> {step === 'login' || step === 'register' ? 'Back to roles' : 'Back to home'}
          </button>

          {step === 'role' ? (
            <div>
              <div className="lg:hidden flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}><span className="text-white font-bold">T</span></div>
                <h1 className="text-xl font-bold gradient-text">Traxale HRM</h1>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Choose Your Role</h2>
              <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>Select how you want to access the platform</p>

              <div className="space-y-4">
                {roles.map((r, i) => {
                  const Icon = r.icon;
                  return (
                    <motion.button key={r.role} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} onClick={() => handleRoleSelect(r.role)} className="w-full text-left p-5 rounded-2xl transition-all hover:scale-[1.02] group glass-card glass-card-hover" style={{ border: '1px solid var(--border-color)' }}>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{ background: r.gradient }}>
                          <Icon size={22} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{r.title}</h3>
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{r.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {r.features.map((f, j) => (
                        <span key={j} className="px-2 py-0.5 rounded-md text-[10px] font-medium" style={{ background: r.color + '15', color: r.color }}>{f}</span>
                      ))}
                    </div>
                  </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : step === 'login' ? (
            <div>
              <div className="glass-card p-8 rounded-3xl">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sign In</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Enter your credentials to continue</p>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                    <input type="email" value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })} required className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })} required className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 pr-12" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-muted)' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]" style={{ background: selectedRoleData?.gradient || 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                    {loading ? 'Signing in...' : <span className="flex items-center justify-center gap-2"><Lock size={16} /> Sign In</span>}
                  </button>
                  <div className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
                    Don't have an account?{' '}
                    <button onClick={() => setStep('register')} style={{ color: '#3B82F6' }} className="font-semibold hover:underline">
                      Sign Up
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div>
              <div className="glass-card p-8 rounded-3xl">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sign Up</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Create your account</p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                    <input type="text" value={registerData.name} onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })} required className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                    <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} required className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} required className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 pr-12" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1" style={{ color: 'var(--text-muted)' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Confirm Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={registerData.confirmPassword} onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })} required className="w-full px-4 py-3.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-blue-500/30 pr-12" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]" style={{ background: selectedRoleData?.gradient || 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                  </button>
                  <div className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
                    Already have an account?{' '}
                    <button onClick={() => setStep('login')} style={{ color: '#3B82F6' }} className="font-semibold hover:underline">
                      Sign In
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
