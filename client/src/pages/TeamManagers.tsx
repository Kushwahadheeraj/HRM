import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Building2, X } from 'lucide-react';
import { getInitials, getAvatarColor } from '../lib/data';
import { employeesAPI } from '../lib/api';
import { Employee } from '../lib/types';

const departments = ['All', 'Engineering', 'Product', 'Design', 'Marketing', 'Human Resources', 'Finance', 'Sales', 'Legal'];
const statuses = ['All', 'active', 'remote', 'on-leave', 'offline'];
const managerRoles = ['HR Manager', 'Product Manager', 'Sales Manager', 'Project Manager', 'Team Manager'];

export default function TeamManagers() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedManager, setSelectedManager] = useState<Employee | null>(null);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const res = await employeesAPI.getAll();
        if (res.success && res.data) {
          const managerList = res.data.filter((emp: Employee) => 
            managerRoles.includes(emp.role)
          );
          setManagers(managerList);
        }
      } catch (error) {
        console.error('Error fetching managers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchManagers();
  }, []);

  const filtered = managers.filter(mgr => {
    const matchSearch = mgr.name.toLowerCase().includes(search.toLowerCase()) || mgr.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'All' || mgr.department === dept;
    const matchStatus = status === 'All' || mgr.status === status;
    return matchSearch && matchDept && matchStatus;
  });

  const statusColor = (s: string) => s === 'active' ? '#10B981' : s === 'remote' ? '#3B82F6' : s === 'on-leave' ? '#F59E0B' : '#64748B';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg" style={{ color: 'var(--text-primary)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Managers</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{managers.length} managers across {departments.length - 1} departments</p>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search managers..." className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} />
            {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: 'var(--text-muted)' }} /></button>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={dept} onChange={e => setDept(e.target.value)} className="appearance-none px-4 py-2.5 pr-8 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {departments.map(d => <option key={d} value={d} style={{ color: 'black' }}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
            </div>
            <div className="relative">
              <select value={status} onChange={e => setStatus(e.target.value)} className="appearance-none px-4 py-2.5 pr-8 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {statuses.map(s => <option key={s} value={s} style={{ color: 'black' }}>{s === 'All' ? 'All Status' : s}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {managers.length} managers</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((mgr, i) => (
          <motion.div key={mgr.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer transition-all group" onClick={() => setSelectedManager(mgr)}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(mgr.name) }}>
                {getInitials(mgr.name)}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(mgr.status) }} />
                <span className="text-[10px] capitalize font-medium" style={{ color: 'var(--text-muted)' }}>{mgr.status}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{mgr.name}</h3>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{mgr.role}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Building2 size={12} style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{mgr.department}</span></div>
              <div className="flex items-center gap-2"><Mail size={12} style={{ color: 'var(--text-muted)' }} /><span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{mgr.email}</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      {selectedManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedManager(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedManager(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: getAvatarColor(selectedManager.name) }}>{getInitials(selectedManager.name)}</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedManager.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedManager.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email', value: selectedManager.email },
                { label: 'Phone', value: selectedManager.phone },
                { label: 'Department', value: selectedManager.department },
                { label: 'Employee ID', value: selectedManager.employeeId },
                { label: 'Join Date', value: selectedManager.joinDate },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                  <div><p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</p><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
