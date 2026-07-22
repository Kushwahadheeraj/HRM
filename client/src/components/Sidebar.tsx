import { useApp } from '../App';
import { Page, UserRole } from '../lib/types';
import {
  LayoutDashboard, Users, Clock, Bot, BarChart3,
  CalendarDays, DollarSign, UserPlus, Settings,
  LogOut, ChevronLeft, ChevronRight, Zap,
  UserCircle, ClipboardCheck, CreditCard, FileText,
  UserCheck, Shield, TrendingUp, Star
} from 'lucide-react';
import TrialStatus from './TrialStatus';

type MenuIcon = typeof LayoutDashboard;

interface MenuItem {
  icon: MenuIcon;
  label: string;
  page: Page;
}

const managerRoleLabels = ['Product Manager', 'Sales Manager', 'Project Manager', 'Team Manager'];

const hrManagerMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Users, label: 'Employees', page: 'employees' },
  { icon: UserCheck, label: 'Managers', page: 'team-managers' },
  { icon: Clock, label: 'Attendance', page: 'attendance' },
  { icon: ClipboardCheck, label: 'Attendance Approvals', page: 'attendance-approvals' },
  { icon: CalendarDays, label: 'Leave Management', page: 'leave' },
  { icon: CreditCard, label: 'Payroll', page: 'payroll' },
  { icon: TrendingUp, label: 'Performance', page: 'performance' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: UserPlus, label: 'Recruitment', page: 'recruitment' },
  { icon: Bot, label: 'AI Assistant', page: 'ai-assistant' },
  { icon: Star, label: 'Submit Review', page: 'submit-review' },
  { icon: Settings, label: 'Organization Settings', page: 'organization-settings' },
  { icon: Settings, label: 'Settings', page: 'settings' },
  { icon: Clock, label: 'My Attendance', page: 'my-attendance' },
  { icon: CalendarDays, label: 'My Leaves', page: 'my-leaves' },
  { icon: CreditCard, label: 'My Payroll', page: 'my-payroll' },
  { icon: UserCircle, label: 'My Profile', page: 'my-profile' },
];

const teamManagerMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'My Dashboard', page: 'team-manager-dashboard' },
  { icon: Users, label: 'My Team', page: 'team' },
  { icon: Clock, label: 'Team Attendance', page: 'attendance' },
  { icon: ClipboardCheck, label: 'Approvals', page: 'approvals' },
  { icon: CalendarDays, label: 'Leave Requests', page: 'leave' },
  { icon: TrendingUp, label: 'Performance', page: 'performance' },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' },
  { icon: Bot, label: 'AI Assistant', page: 'ai-assistant' },
  { icon: Settings, label: 'Settings', page: 'settings' },
  { icon: Clock, label: 'My Attendance', page: 'my-attendance' },
  { icon: CalendarDays, label: 'My Leaves', page: 'my-leaves' },
  { icon: CreditCard, label: 'My Payroll', page: 'my-payroll' },
  { icon: UserCircle, label: 'My Profile', page: 'my-profile' },
];

const employeeMenu: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' },
  { icon: Clock, label: 'My Attendance', page: 'my-attendance' },
  { icon: CalendarDays, label: 'My Leaves', page: 'my-leaves' },
  { icon: CreditCard, label: 'My Payroll', page: 'my-payroll' },
  { icon: UserCircle, label: 'My Profile', page: 'my-profile' },
  { icon: Users, label: 'Team Directory', page: 'team' },
  { icon: Bot, label: 'AI Assistant', page: 'ai-assistant' },
  { icon: Settings, label: 'Settings', page: 'settings' }];

const menus: Record<string, MenuItem[]> = {
  hr_manager: hrManagerMenu,
  super_admin: hrManagerMenu,
  team_manager: teamManagerMenu,
  employee: employeeMenu,
};

export default function Sidebar() {
  const { currentPage, setCurrentPage, sidebarOpen, setSidebarOpen, logout, currentUser } = useApp();
  
  // Check if user is any manager role by roleLabel (but not HR Manager!)
  const isManagerUser = currentUser && managerRoleLabels.includes(currentUser.roleLabel);
  const role = currentUser?.role || 'employee';
  const isSuperAdmin = currentUser?.email === 'dheeraj01072001@gmail.com';
  
  // If user has hr_manager or super_admin, always use hrManagerMenu
  let menuItems;
  if (role === 'hr_manager' || role === 'super_admin') {
    menuItems = hrManagerMenu;
  } else if (isManagerUser && role === 'employee') {
    menuItems = teamManagerMenu;
  } else {
    menuItems = menus[role];
  }

  // If department is "Administration", hide specific menu items
  if (currentUser?.department === 'Administration') {
    const pagesToHide = ['my-payroll', 'my-attendance', 'my-leaves', 'organization-settings', 'leave', 'attendance-approvals', 'attendance', 'performance'];
    menuItems = menuItems.filter(item => !pagesToHide.includes(item.page));
  }

  const roleColors: Record<string, string> = {
    hr_manager: '#3B82F6',
    super_admin: '#3B82F6',
    team_manager: '#F97316',
    employee: '#10B981',
  };

  const roleGradients: Record<string, string> = {
    hr_manager: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    super_admin: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    team_manager: 'linear-gradient(135deg, #F97316, #EA580C)',
    employee: 'linear-gradient(135deg, #10B981, #059669)',
  };

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={'fixed left-0 top-0 h-full z-50 flex flex-col transition-all duration-300 ' + (sidebarOpen ? 'w-64' : 'w-20') + ' ' + (sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0')} style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-color)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <img src="/logo.png" alt="Traxale Logo" className="w-10 h-10 rounded-xl flex-shrink-0 neon-glow" />
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold gradient-text leading-tight">Traxale</h1>
              <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>HRM Platform</p>
            </div>
          )}
        </div>

        {/* User badge */}
        {sidebarOpen && currentUser && (
          <div className="mx-3 mt-4 mb-2 p-3 rounded-xl" style={{ background: roleColors[role] + '10', border: '1px solid ' + roleColors[role] + '25' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: roleGradients[role] }}>
                {currentUser.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{currentUser.name}</p>
                <p className="text-[10px] truncate" style={{ color: roleColors[role] }}>{currentUser.roleLabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {/* Super Admin Dashboard (only for super admin email) */}
        {isSuperAdmin ? (
          <>
            <button 
              key="super-admin-dashboard" 
              onClick={() => { 
                setCurrentPage('super-admin-dashboard'); 
                if (window.innerWidth < 768) setSidebarOpen(false); 
              }} 
              className={'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (currentPage === 'super-admin-dashboard' ? 'active' : '')} 
              style={{ color: currentPage === 'super-admin-dashboard' ? roleColors[role] : 'var(--text-secondary)', background: currentPage === 'super-admin-dashboard' ? roleColors[role] + '12' : 'transparent' }} 
              title={!sidebarOpen ? 'Super Admin Dashboard' : undefined}
            >
              <Shield size={19} style={{ color: currentPage === 'super-admin-dashboard' ? roleColors[role] : 'var(--text-muted)' }} />
              {sidebarOpen && <span>Super Admin Dashboard</span>}
              {currentPage === 'super-admin-dashboard' && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: roleColors[role] }} />}
            </button>
            <button 
              key="super-admin-pricing" 
              onClick={() => { 
                setCurrentPage('super-admin-pricing'); 
                if (window.innerWidth < 768) setSidebarOpen(false); 
              }} 
              className={'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (currentPage === 'super-admin-pricing' ? 'active' : '')} 
              style={{ color: currentPage === 'super-admin-pricing' ? roleColors[role] : 'var(--text-secondary)', background: currentPage === 'super-admin-pricing' ? roleColors[role] + '12' : 'transparent' }} 
              title={!sidebarOpen ? 'Manage Pricing' : undefined}
            >
              <Settings size={19} style={{ color: currentPage === 'super-admin-pricing' ? roleColors[role] : 'var(--text-muted)' }} />
              {sidebarOpen && <span>Manage Pricing</span>}
              {currentPage === 'super-admin-pricing' && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: roleColors[role] }} />}
            </button>
            <button 
              key="super-admin-reviews" 
              onClick={() => { 
                setCurrentPage('super-admin-reviews'); 
                if (window.innerWidth < 768) setSidebarOpen(false); 
              }} 
              className={'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (currentPage === 'super-admin-reviews' ? 'active' : '')} 
              style={{ color: currentPage === 'super-admin-reviews' ? roleColors[role] : 'var(--text-secondary)', background: currentPage === 'super-admin-reviews' ? roleColors[role] + '12' : 'transparent' }} 
              title={!sidebarOpen ? 'Manage Reviews' : undefined}
            >
              <Star size={19} style={{ color: currentPage === 'super-admin-reviews' ? roleColors[role] : 'var(--text-muted)' }} />
              {sidebarOpen && <span>Manage Reviews</span>}
              {currentPage === 'super-admin-reviews' && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: roleColors[role] }} />}
            </button>
          </>
        ) : (
          menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.page;
            return (
              <button key={item.page} onClick={() => { setCurrentPage(item.page); if (window.innerWidth < 768) setSidebarOpen(false); }} className={'sidebar-item w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ' + (isActive ? 'active' : '')} style={{ color: isActive ? roleColors[role] : 'var(--text-secondary)', background: isActive ? roleColors[role] + '12' : 'transparent' }} title={!sidebarOpen ? item.label : undefined}>
                <Icon size={19} style={{ color: isActive ? roleColors[role] : 'var(--text-muted)' }} />
                {sidebarOpen && <span>{item.label}</span>}
                {isActive && sidebarOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: roleColors[role] }} />}
              </button>
            );
          })
        )}
        </nav>

        {/* Trial Status Badge */}
        {sidebarOpen && <TrialStatus />}

        {/* AI Pro Badge */}
        {sidebarOpen && (
          <div className="mx-3 mb-2 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(249, 115, 22, 0.08))', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={13} style={{ color: '#F97316' }} />
              <span className="text-[10px] font-bold" style={{ color: '#F97316' }}>AI Pro Active</span>
            </div>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Smart insights enabled</p>
          </div>
        )}

        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-red-500/10 hover:text-red-400" style={{ color: 'var(--text-muted)' }}>
            <LogOut size={19} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center transition-all hover:scale-110" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          {sidebarOpen ? <ChevronLeft size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
        </button>
      </aside>
    </>
  );
}
