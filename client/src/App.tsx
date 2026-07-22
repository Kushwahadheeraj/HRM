import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeMode, Page, UserRole, User } from './lib/types';
import { authAPI } from './lib/api';
import { CurrencyProvider } from './lib/currency';
import { SocketProvider } from './lib/socket';

import Landing from './pages/Landing';
import Login from './pages/Login';
import RegisterAdmin from './pages/RegisterAdmin';
import DashboardLayout from './components/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import AIAssistant from './pages/AIAssistant';
import Analytics from './pages/Analytics';
import LeaveManagement from './pages/LeaveManagement';
import Payroll from './pages/Payroll';
import Recruitment from './pages/Recruitment';
import Settings from './pages/Settings';
import MyProfile from './pages/MyProfile';
import MyAttendance from './pages/MyAttendance';
import MyLeaves from './pages/MyLeaves';
import MyPayroll from './pages/MyPayroll';
import TeamView from './pages/TeamView';
import Approvals from './pages/Approvals';
import TeamManagers from './pages/TeamManagers';
import TeamManagerDashboard from './pages/TeamManagerDashboard';
import Performance from './pages/Performance';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminPricing from './pages/SuperAdminPricing';
import SubmitReview from './pages/SubmitReview';
import SuperAdminReviews from './pages/SuperAdminReviews';
import OrganizationSettings from './pages/OrganizationSettings';
import AttendanceApprovals from './pages/AttendanceApprovals';

interface AppContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isLoggedIn: boolean;
  currentUser: User | null;
  login: (userData: User) => void;
  logout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  registerMode: 'free-trial' | 'paid';
  setRegisterMode: (mode: 'free-trial' | 'paid') => void;
  registerPlan: 'Basic' | 'Pro' | 'Enterprise';
  setRegisterPlan: (plan: 'Basic' | 'Pro' | 'Enterprise') => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// Initialize state from localStorage
const getInitialState = () => {
  const savedUser = localStorage.getItem('currentUser');
  const savedPage = localStorage.getItem('currentPage');
  const savedLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // If saved, restore state, else default
  return {
    currentUser: savedUser ? JSON.parse(savedUser) : null,
    isLoggedIn: savedLoggedIn,
    currentPage: (savedPage as Page) || (savedLoggedIn ? 'dashboard' : 'landing')
  };
};

function AppProvider({ children }: { children: ReactNode }) {
  const initial = getInitialState();
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [currentPage, setCurrentPage] = useState<Page>(initial.currentPage);    
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [currentUser, setCurrentUser] = useState<User | null>(initial.currentUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [registerMode, setRegisterMode] = useState<'free-trial' | 'paid'>('paid');
  const [registerPlan, setRegisterPlan] = useState<'Basic' | 'Pro' | 'Enterprise'>('Pro');

  // Save state to localStorage when it changes
  const updateLocalStorage = () => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentPage', currentPage);
    } else {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentPage');
    }
  };

  // Watch for changes and save to localStorage
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');     

  const managerRoleLabels = ['Product Manager', 'Sales Manager', 'Project Manager', 'Team Manager'];

  const login = (userData: User) => {
    setCurrentUser(userData);
    setIsLoggedIn(true);
    // Check if super admin email
    if (userData.email === 'dheeraj01072001@gmail.com') {
      setCurrentPage('super-admin-dashboard');
    }
    // For HR Manager or Super Admin: always go to dashboard
    else if (userData.role === 'hr_manager' || userData.role === 'super_admin') {
      setCurrentPage('dashboard');
    } 
    // For team managers (non HR): go to team manager dashboard
    else if (userData.role === 'team_manager' || managerRoleLabels.includes(userData.roleLabel)) {
      setCurrentPage('team-manager-dashboard');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentPage('landing');
  };

  // Use useEffect to update localStorage when state changes
  useEffect(() => {
    updateLocalStorage();
  }, [isLoggedIn, currentUser, currentPage]);

  return (
    <AppContext.Provider value={{ theme, toggleTheme, currentPage, setCurrentPage, isLoggedIn, currentUser, login, logout, sidebarOpen, setSidebarOpen, registerMode, setRegisterMode, registerPlan, setRegisterPlan }}>      
      <div className={theme === 'light' ? 'light-mode' : ''}>
        {children}
      </div>
    </AppContext.Provider>
  );
}

function AppContent() {
  const { currentPage, isLoggedIn, currentUser, registerMode } = useApp();

  if (!isLoggedIn) {
    return (
      <AnimatePresence mode="wait">
        {currentPage === 'login' ? (
          <Login key="login" />
        ) : currentPage === 'register-admin' ? (
          <RegisterAdmin key="register-admin" mode={registerMode} />
        ) : (
          <Landing key="landing" />
        )}
      </AnimatePresence>
    );
  }

  const role = currentUser?.role || 'employee';

  const allPages: Record<string, ReactNode> = {
    dashboard: <Dashboard />,
    employees: <Employees />,
    'team-managers': <TeamManagers />,
    'team-manager-dashboard': <TeamManagerDashboard />,
    attendance: <Attendance />,
    'ai-assistant': <AIAssistant />,
    analytics: <Analytics />,
    leave: <LeaveManagement />,
    payroll: <Payroll />,
    recruitment: <Recruitment />,
    settings: <Settings />,
    'my-profile': <MyProfile />,
    'my-attendance': <MyAttendance />,
    'my-leaves': <MyLeaves />,
    'my-payroll': <MyPayroll />,
    team: <TeamView />,
    approvals: <Approvals />,
    performance: <Performance />,
    'super-admin-dashboard': <SuperAdminDashboard />,
    'super-admin-pricing': <SuperAdminPricing />,
    'submit-review': <SubmitReview />,
    'super-admin-reviews': <SuperAdminReviews />,
    'organization-settings': <OrganizationSettings />,
    'attendance-approvals': <AttendanceApprovals />,
  };

  return (
    <DashboardLayout>
      <AnimatePresence mode="wait">
        <div key={currentPage + role} className="fade-in">
          {allPages[currentPage] || <Dashboard />}
        </div>
      </AnimatePresence>
    </DashboardLayout>
  );
}

function AppContentWithCurrency() {
  const { currentUser } = useApp();
  return (
    <SocketProvider>
      <CurrencyProvider countryCode={(currentUser as any)?.country}>
        <AppContent />
      </CurrencyProvider>
    </SocketProvider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContentWithCurrency />
    </AppProvider>
  );
}
