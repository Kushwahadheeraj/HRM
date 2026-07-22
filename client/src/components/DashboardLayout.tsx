import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ChatWidget from './ChatWidget';
import { useApp } from '../App';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { sidebarOpen, currentUser } = useApp();
  const isHR = currentUser?.role === 'hr_manager';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'ml-0 md:ml-64' : 'ml-0 md:ml-20'}`}>
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
        <ChatWidget />
      </div>
    </div>
  );
}
