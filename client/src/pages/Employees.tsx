import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Download, Mail, Building2, Award, ChevronDown, X, Eye, Edit3, Upload, FileText, Clock, Calendar, TrendingUp } from 'lucide-react';
import { getInitials, getAvatarColor } from '../lib/data';
import { employeesAPI, attendanceAPI, leavesAPI, teamManagersAPI } from '../lib/api';
import { Employee, TeamManager } from '../lib/types';
import { countries } from '../lib/countries';

const departments = ['All', 'Engineering', 'Product', 'Design', 'Marketing', 'Human Resources', 'Finance', 'Sales', 'Legal'];
const statuses = ['All', 'active', 'remote', 'on-leave', 'offline'];
const roles = ['Senior Engineer', 'Product Manager', 'UX Designer', 'DevOps Lead', 'HR Manager', 'Data Scientist', 'Frontend Developer', 'Marketing Director', 'Finance Analyst', 'Backend Developer', 'QA Engineer', 'Sales Manager', 'Project Manager'];
const managerRoles = ['HR Manager', 'Product Manager', 'Sales Manager', 'Project Manager', 'Team Manager'];

export default function Employees() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee & { phoneCountryCode?: string; phoneNumber?: string } | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
    avatar: '',
    status: 'active' as const,
    joinDate: new Date().toISOString().split('T')[0],
    phone: '',
    phoneCountryCode: '+91',
    phoneNumber: '',
    employeeId: '',
    salary: 0,
    performance: 80,
    manager: '',
    password: '',
    address: '',
    country: 'IN',
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [managers, setManagers] = useState<Employee[]>([]);

  // Export function to Excel
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Department', 'Status', 'Join Date', 'Phone', 'Employee ID', 'Salary', 'Performance', 'Manager'],
      ...employees.map(emp => [
        emp.name,
        emp.email,
        emp.role,
        emp.department,
        emp.status,
        emp.joinDate,
        emp.phone,
        emp.employeeId,
        emp.salary,
        emp.performance,
        emp.manager,
      ]),
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employees.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const empRes = await employeesAPI.getAll();
        if (empRes.success && empRes.data) {
          setEmployees(empRes.data);
          // Filter managers from employees
          const managerList = empRes.data.filter((emp: Employee) => 
            managerRoles.includes(emp.role)
          );
          setManagers(managerList);
        }
      } catch (error) {
        // console.error('Error fetching employees:', error);
      }
    };
    fetchData();
  }, []);

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'All' || e.department === dept;
    const matchStatus = status === 'All' || e.status === status;
    return matchSearch && matchDept && matchStatus;
  });

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // console.log('=== handleAddEmployee called ===');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      // console.log('Full currentUser object:', currentUser);
      // console.log('currentUser keys:', Object.keys(currentUser));
      // console.log('currentUser.organizationId:', currentUser.organizationId);
      // console.log('currentUser._id:', currentUser._id);
      // console.log('currentUser.id:', currentUser.id);
      const employeeToAdd = {
        ...newEmployee,
        phone: `${newEmployee.phoneCountryCode} ${newEmployee.phoneNumber}`,
      };
      // console.log('Sending employee data:', employeeToAdd);
      const res = await employeesAPI.create(employeeToAdd);
      // console.log('Server response:', res);
      if (res.success && res.data) {
        setEmployees([res.data, ...employees]);
        setShowAddModal(false);
        setNewEmployee({
          name: '',
          email: '',
          role: '',
          department: '',
          avatar: '',
          status: 'active',
          joinDate: new Date().toISOString().split('T')[0],
          phone: '',
          phoneCountryCode: '+91',
          phoneNumber: '',
          employeeId: '',
          salary: 0,
          performance: 80,
          manager: '',
          password: '',
          address: '',
          country: 'IN',
        });
      } else {
        alert('Error: ' + res.message);
      }
    } catch (error) {
      // console.error('Error adding employee:', error);
      alert('Failed to add employee: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    if (!importFile) return;
    setLoading(true);
    try {
      const res = await employeesAPI.bulkImport(importFile);
      setImportResult(res);
      if (res.success) {
        const fetchRes = await employeesAPI.getAll();
        if (fetchRes.success && fetchRes.data) setEmployees(fetchRes.data);
      }
    } catch (error) {
      // console.error('Error importing employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployee) return;
    setLoading(true);
    try {
      const employeeToUpdate = {
        ...editEmployee,
        phone: `${editEmployee.phoneCountryCode} ${editEmployee.phoneNumber}`,
      };
      const editId = editEmployee.id || editEmployee._id || '';
      const res = await employeesAPI.update(editId, employeeToUpdate);
      if (res.success && res.data) {
        setEmployees(prev => prev.map(emp => {
          if ((emp.id === editEmployee.id || emp._id === editEmployee._id) && res.data) {
            return res.data;
          }
          return emp;
        }));
        setShowEditModal(false);
        setEditEmployee(null);
      }
    } catch (error) {
      // console.error('Error updating employee:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineData = async (employeeId: string) => {
    setLoading(true);
    try {
      const [attendanceRes, leavesRes] = await Promise.all([
        attendanceAPI.getByEmployee(employeeId),
        leavesAPI.getByEmployee(employeeId)
      ]);

      const combined = [
        ...(attendanceRes.success && attendanceRes.data ? attendanceRes.data.map((item: any) => ({
          type: 'attendance',
          date: item.date,
          title: 'Attendance',
          description: `Clock In: ${item.clockIn || 'N/A'}, Clock Out: ${item.clockOut || 'N/A'}, Status: ${item.status}`,
          color: item.status === 'present' ? '#10B981' : item.status === 'late' ? '#F59E0B' : '#EF4444'
        })) : []),
        ...(leavesRes.success && leavesRes.data ? leavesRes.data.map((item: any) => ({
          type: 'leave',
          date: item.startDate,
          title: `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} Leave`,
          description: `${item.startDate} to ${item.endDate}, Status: ${item.status}`,
          color: item.status === 'approved' ? '#10B981' : item.status === 'pending' ? '#F59E0B' : '#EF4444'
        })) : [])
      ];

      // Sort by date
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimelineData(combined);
    } catch (error) {
      // console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => s === 'active' ? '#10B981' : s === 'remote' ? '#3B82F6' : s === 'on-leave' ? '#F59E0B' : '#64748B';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Employee Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{employees.length} total employees across {departments.length - 1} departments</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <Upload size={16} /> Import
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      <div className="glass-card p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employees..." className="bg-transparent outline-none text-sm flex-1" style={{ color: 'var(--text-primary)' }} />
            {search && <button onClick={() => setSearch('')}><X size={14} style={{ color: 'var(--text-muted)' }} /></button>}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={dept} onChange={e => setDept(e.target.value)} className="appearance-none px-4 py-2.5 pr-8 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {departments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="relative">
              <select value={status} onChange={e => setStatus(e.target.value)} className="appearance-none px-4 py-2.5 pr-8 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                {statuses.map(s => <option key={s} value={s}>{s === 'All' ? 'All Status' : s}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {employees.length} employees</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((emp, i) => (
          <motion.div key={emp.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card glass-card-hover p-5 rounded-2xl cursor-pointer transition-all group" onClick={() => setSelectedEmployee(emp)}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: getAvatarColor(emp.name) }}>
                {getInitials(emp.name)}
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(emp.status) }} />
                <span className="text-[10px] capitalize font-medium" style={{ color: 'var(--text-muted)' }}>{emp.status}</span>
              </div>
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{emp.name}</h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{emp.role}</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><Building2 size={12} style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{emp.department}</span></div>
              <div className="flex items-center gap-2"><Mail size={12} style={{ color: 'var(--text-muted)' }} /><span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{emp.email}</span></div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{emp.employeeId}</span>
              <div className="flex items-center gap-1"><Award size={12} style={{ color: '#F59E0B' }} /><span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>{emp.performance}%</span></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Add New Employee</h2>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input type="text" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" autoComplete="off" value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Role</label>
                  <select value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}>
                    <option value="" style={{ color: 'var(--text-primary)' }}>Select Role</option>
                    {roles.map(role => <option key={role} value={role} style={{ color: 'black' }}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Department</label>
                  <select value={newEmployee.department} onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}>
                    <option value="" style={{ color: 'var(--text-primary)' }}>Select Department</option>
                    {departments.slice(1).map(dept => <option key={dept} value={dept} style={{ color: 'black' }}>{dept}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Address</label>
                  <textarea value={newEmployee.address} onChange={e => setNewEmployee({ ...newEmployee, address: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country</label>
                  <select 
                    value={newEmployee.country} 
                    onChange={e => {
                      const country = countries.find(c => c.code === e.target.value);
                      setNewEmployee({ 
                        ...newEmployee, 
                        country: e.target.value,
                        phoneCountryCode: country?.callingCode || '+1'
                      });
                    }} 
                    required 
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" 
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}
                  >
                    {countries.map(country => <option key={country.code} value={country.code} style={{ color: 'black' }}>{country.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country Code</label>
                    <input 
                      type="text" 
                      value={newEmployee.phoneCountryCode} 
                      readOnly 
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" 
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={newEmployee.phoneNumber} 
                      onChange={e => setNewEmployee({ ...newEmployee, phoneNumber: e.target.value })} 
                      required 
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" 
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Employee ID</label>
                  <input type="text" value={newEmployee.employeeId} onChange={e => setNewEmployee({ ...newEmployee, employeeId: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Join Date</label>
                  <input type="date" value={newEmployee.joinDate} onChange={e => setNewEmployee({ ...newEmployee, joinDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</label>
                  <select value={newEmployee.status} onChange={e => setNewEmployee({ ...newEmployee, status: e.target.value as any })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}>
                    {statuses.slice(1).map(status => <option key={status} value={status} style={{ color: 'black' }}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Salary</label>
                  <input type="number" value={newEmployee.salary} onChange={e => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Performance %</label>
                  <input type="number" value={newEmployee.performance} onChange={e => setNewEmployee({ ...newEmployee, performance: Number(e.target.value) })} min="0" max="100" required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Manager</label>
                  <select 
                    value={newEmployee.manager} 
                    onChange={e => setNewEmployee({ ...newEmployee, manager: e.target.value })} 
                    disabled={managerRoles.includes(newEmployee.role)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" 
                    style={{ 
                      background: 'var(--bg-glass)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      zIndex: 1000,
                      opacity: managerRoles.includes(newEmployee.role) ? 0.5 : 1,
                      cursor: managerRoles.includes(newEmployee.role) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" style={{ color: 'var(--text-primary)' }}>Select Manager</option>
                    {managers.map(mgr => {
                      const roleShort = mgr.role.replace(' Manager', '');
                      return (
                        <option key={mgr.id} value={mgr.name} style={{ color: 'black' }}>
                          {mgr.name} ({roleShort})
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Password (for login)</label>
                  <input type="password" autoComplete="new-password" value={newEmployee.password} onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })} required placeholder="Set a password for the employee" className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                  {loading ? 'Adding...' : 'Add Employee'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowImportModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Bulk Import Employees</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Upload an Excel file with employee data (columns: name, email, role, department, joinDate, phone, employeeId, salary, performance, manager, password)</p>
            
            <div className="border-2 border-dashed rounded-2xl p-8 text-center mb-4" style={{ borderColor: 'var(--border-color)' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
              <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{importFile ? importFile.name : 'Choose a file'}</p>
              <input type="file" accept=".xlsx,.xls" onChange={e => e.target.files && setImportFile(e.target.files[0])} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="inline-block px-6 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                Browse Files
              </label>
            </div>
            
            {importResult && (
              <div className="p-4 rounded-xl mb-4" style={{ background: importResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                <p className="text-sm" style={{ color: importResult.success ? '#10B981' : '#EF4444' }}>{importResult.message}</p>
                {importResult.data && (
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Success: {importResult.data.successCount}, Failed: {importResult.data.failCount}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button onClick={handleBulkImport} disabled={!importFile || loading} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                {loading ? 'Importing...' : 'Import'}
              </button>
              <button onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedEmployee(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEmployee(null)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: getAvatarColor(selectedEmployee.name) }}>{getInitials(selectedEmployee.name)}</div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{selectedEmployee.name}</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{selectedEmployee.role}</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Email', value: selectedEmployee.email },
                { label: 'Phone', value: selectedEmployee.phone },
                { label: 'Department', value: selectedEmployee.department },
                { label: 'Employee ID', value: selectedEmployee.employeeId },
                { label: 'Join Date', value: selectedEmployee.joinDate },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                  <div><p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{item.label}</p><p className="text-sm" style={{ color: 'var(--text-primary)' }}>{item.value}</p></div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Performance Score</span>
                <span className="text-sm font-bold" style={{ color: '#10B981' }}>{selectedEmployee.performance}%</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
                <div className="h-full rounded-full" style={{ width: selectedEmployee.performance + '%', background: 'linear-gradient(90deg, #3B82F6, #10B981)' }} />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button 
                onClick={() => {
                  // Parse phone into country code and number
                  const phoneParts = selectedEmployee.phone.split(' ');
                  const phoneCountryCode = phoneParts[0];
                  const phoneNumber = phoneParts.slice(1).join(' ');
                  // Find country based on phone code if country not present
                  const defaultCountry = countries.find(c => c.callingCode === phoneCountryCode)?.code || 'IN';
                  setEditEmployee({
                    ...selectedEmployee,
                    country: selectedEmployee.country || defaultCountry,
                    phoneCountryCode,
                    phoneNumber
                  });
                  setShowEditModal(true);
                  setSelectedEmployee(null);
                }} 
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" 
                style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
              >
                Edit Profile
              </button>
              <button 
                onClick={() => {
                  fetchTimelineData(selectedEmployee.employeeId);
                  setShowTimelineModal(true);
                  setSelectedEmployee(null);
                }} 
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" 
                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                View Timeline
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setShowEditModal(false); setEditEmployee(null); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => { setShowEditModal(false); setEditEmployee(null); }} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Edit Employee</h2>
            <form onSubmit={handleEditEmployee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input type="text" value={editEmployee.name} onChange={e => setEditEmployee({ ...editEmployee, name: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" autoComplete="off" value={editEmployee.email} onChange={e => setEditEmployee({ ...editEmployee, email: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Role</label>
                  <select value={editEmployee.role} onChange={e => setEditEmployee({ ...editEmployee, role: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}>
                    <option value="" style={{ color: 'var(--text-primary)' }}>Select Role</option>
                    {roles.map(role => <option key={role} value={role} style={{ color: 'black' }}>{role}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Department</label>
                  <select value={editEmployee.department} onChange={e => setEditEmployee({ ...editEmployee, department: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}>
                    <option value="" style={{ color: 'var(--text-primary)' }}>Select Department</option>
                    {departments.slice(1).map(dept => <option key={dept} value={dept} style={{ color: 'black' }}>{dept}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Address</label>
                  <textarea value={editEmployee.address || ''} onChange={e => setEditEmployee({ ...editEmployee, address: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country</label>
                  <select 
                    value={editEmployee.country || 'IN'} 
                    onChange={e => {
                      const country = countries.find(c => c.code === e.target.value);
                      setEditEmployee({ 
                        ...editEmployee, 
                        country: e.target.value,
                        phoneCountryCode: country?.callingCode || '+91'
                      });
                    }} 
                    required 
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" 
                    style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}
                  >
                    {countries.map(country => <option key={country.code} value={country.code} style={{ color: 'black' }}>{country.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Country Code</label>
                    <input 
                      type="text" 
                      value={editEmployee.phoneCountryCode} 
                      readOnly 
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" 
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                    <input 
                      type="text" 
                      value={editEmployee.phoneNumber || ''} 
                      onChange={e => setEditEmployee({ ...editEmployee, phoneNumber: e.target.value })} 
                      required 
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" 
                      style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Employee ID</label>
                  <input type="text" value={editEmployee.employeeId} onChange={e => setEditEmployee({ ...editEmployee, employeeId: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Join Date</label>
                  <input type="date" value={editEmployee.joinDate} onChange={e => setEditEmployee({ ...editEmployee, joinDate: e.target.value })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Status</label>
                  <select value={editEmployee.status} onChange={e => setEditEmployee({ ...editEmployee, status: e.target.value as any })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', zIndex: 1000 }}>
                    {statuses.slice(1).map(status => <option key={status} value={status} style={{ color: 'black' }}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Salary</label>
                  <input type="number" value={editEmployee.salary} onChange={e => setEditEmployee({ ...editEmployee, salary: Number(e.target.value) })} required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Performance %</label>
                  <input type="number" value={editEmployee.performance} onChange={e => setEditEmployee({ ...editEmployee, performance: Number(e.target.value) })} min="0" max="100" required className="w-full px-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Manager</label>
                  <select 
                    value={editEmployee.manager} 
                    onChange={e => setEditEmployee({ ...editEmployee, manager: e.target.value })} 
                    disabled={managerRoles.includes(editEmployee.role)}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer" 
                    style={{ 
                      background: 'var(--bg-glass)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      zIndex: 1000,
                      opacity: managerRoles.includes(editEmployee.role) ? 0.5 : 1,
                      cursor: managerRoles.includes(editEmployee.role) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <option value="" style={{ color: 'var(--text-primary)' }}>Select Manager</option>
                    {managers.map(mgr => {
                      const roleShort = mgr.role.replace(' Manager', '');
                      return (
                        <option key={mgr.id} value={mgr.name} style={{ color: 'black' }}>
                          {mgr.name} ({roleShort})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}>
                  {loading ? 'Updating...' : 'Update Employee'}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditEmployee(null); }} className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Timeline Modal */}
      {showTimelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTimelineModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative glass-card p-6 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowTimelineModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10" style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
            <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Employee Timeline</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--text-muted)' }}></div>
            </div>
            ) : timelineData.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <p>No timeline data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {timelineData.map((item, index) => (
                <div key={index} className="relative pl-8 pb-4" style={{ borderLeft: '2px solid var(--border-color)' }}>
                  <div className="absolute left-[-6px] top-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background: item.color + '20', color: item.color }}>
                    {item.type === 'attendance' ? <Clock size={16} /> : <Calendar size={16} />}
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                  </div>
                </div>
              ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
