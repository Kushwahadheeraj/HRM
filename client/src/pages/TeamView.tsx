import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../App';
import { Search, Mail, Phone, Building2, MapPin, MessageCircle, X, Send } from 'lucide-react';
import { employeesAPI, messagesAPI } from '../lib/api';
import { getInitials, getAvatarColor } from '../lib/data';
import { Employee, Message } from '../lib/types';

const managerRoles = ['HR Manager', 'Product Manager', 'Sales Manager', 'Project Manager', 'Team Manager'];

export default function TeamView() {
  const { currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeesAPI.getAll();
        if (res.success && res.data) {
          setEmployees(res.data);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      }
    };
    fetchEmployees();
  }, []);

  const isManager = currentUser && managerRoles.includes(currentUser.roleLabel);
  
  // Find current user in employees to get their manager
  const currentEmployee = employees.find(e => e.employeeId === currentUser?.employeeId);
  
  // For managers: show their team
  // For regular employees: show employees with same manager + themselves
  const teamMembers = isManager
    ? employees.filter(e => e.manager === currentUser.name)
    : currentEmployee
      ? employees.filter(e => 
          (e.manager === currentEmployee.manager && e.manager) || e.id === currentEmployee.id
        )
      : employees;

  const filtered = teamMembers.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.department.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = (s: string) => s === 'active' ? '#10B981' : s === 'remote' ? '#3B82F6' : s === 'on-leave' ? '#F59E0B' : '#64748B';

  const handleSendMessage = async () => {
    if (!selected || !message.trim() || !currentUser) return;
    try {
      const recipientEmployee = employees.find(e => e.id === selected.id);
      if (!recipientEmployee) return;
      const recipientRes = await employeesAPI.getByEmployeeId(recipientEmployee.employeeId);
      if (recipientRes.success && recipientRes.data) {
        const recipientId = recipientRes.data.id || recipientRes.data._id;
        if (!recipientId) return;
        await messagesAPI.sendMessage({
          from: currentUser.id || '',
          to: recipientId,
          content: message
        });
        setMessage('');
        if (currentUser.id && recipientId) {
          const msgsRes = await messagesAPI.getMessages(currentUser.id, recipientId);
          if (msgsRes.success && msgsRes.data) {
            setMessages(msgsRes.data);
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selected || !currentUser) return;
      try {
        const recipientEmployee = employees.find(e => e.id === selected.id);
        if (!recipientEmployee) return;
        const recipientRes = await employeesAPI.getByEmployeeId(recipientEmployee.employeeId);
        if (recipientRes.success && recipientRes.data && currentUser.id) {
          const recipientId = recipientRes.data.id || recipientRes.data._id;
          if (!recipientId) return;
          const msgsRes = await messagesAPI.getMessages(currentUser.id, recipientId);
          if (msgsRes.success && msgsRes.data) {
            setMessages(msgsRes.data);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };
    fetchMessages();
  }, [selected, currentUser, employees]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {isManager ? 'My Team' : 'My Team Directory'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {isManager ? teamMembers.length + ' team members reporting to you' : teamMembers.length + ' team members in your team'}
        </p>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 rounded-xl max-w-md" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
        <Search size={16} style={{ color: 'var(--text-muted)' }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, or department..." className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} />
        {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: 'var(--text-muted)' }} /></button>}
      </div>

      {isManager && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Team Size', value: teamMembers.length, color: '#3B82F6' },
            { label: 'Active Now', value: teamMembers.filter(e => e.status === 'active').length, color: '#10B981' },
            { label: 'On Leave', value: teamMembers.filter(e => e.status === 'on-leave').length, color: '#F59E0B' },
            { label: 'Avg Performance', value: teamMembers.length > 0 ? Math.round(teamMembers.reduce((a, e) => a + e.performance, 0) / teamMembers.length) + '%' : '0%', color: '#8B5CF6' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 rounded-2xl text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} onClick={() => setSelected(emp)} className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(emp.name) }}>
                {getInitials(emp.name)}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(emp.status) }} />
                <span className="text-[10px] capitalize font-medium" style={{ color: 'var(--text-muted)' }}>{emp.status}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{emp.name}</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{emp.role}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><Building2 size={12} style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.department}</span></div>
              <div className="flex items-center gap-2"><Mail size={12} style={{ color: 'var(--text-muted)' }} /><span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{emp.email}</span></div>
            </div>
            {isManager && (
              <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-glass)' }}>
                    <div className="h-full rounded-full" style={{ width: emp.performance + '%', background: emp.performance >= 90 ? '#10B981' : '#F59E0B' }} />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: emp.performance >= 90 ? '#10B981' : '#F59E0B' }}>{emp.performance}%</span>
                </div>
                <button className="p-1.5 rounded-lg transition-all hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><MessageCircle size={14} /></button>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: getAvatarColor(selected.name) }}>{getInitials(selected.name)}</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selected.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selected.role}</p>
                <div className="flex items-center gap-1 mt-1"><span className="w-2 h-2 rounded-full" style={{ background: statusColor(selected.status) }} /><span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{selected.status}</span></div>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              {[
                { icon: Mail, label: selected.email },
                { icon: Phone, label: selected.phone },
                { icon: Building2, label: selected.department },
                { icon: MapPin, label: 'San Francisco, CA' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                  <item.icon size={16} style={{ color: '#3B82F6' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border-color)] pt-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Send Message</h3>
              <div className="space-y-3 mb-3 max-h-40 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === currentUser?._id ? 'justify-end' : 'justify-start'}`}>
                    <div className="px-3 py-2 rounded-lg max-w-xs" style={{
                      background: msg.from === currentUser?._id ? '#3B82F6' : 'var(--bg-glass)',
                      color: msg.from === currentUser?._id ? 'white' : 'var(--text-primary)'
                    }}>
                      <p className="text-xs">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-transparent outline-none px-3 py-2 rounded-lg text-sm"
                  style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button onClick={handleSendMessage} className="p-2 rounded-lg text-white" style={{ background: '#3B82F6' }}><Send size={16} /></button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}