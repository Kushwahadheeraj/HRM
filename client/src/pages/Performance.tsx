import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Loader2, Save } from 'lucide-react';
import { performanceAPI, employeesAPI } from '../lib/api';

interface PerformanceData {
  id?: string;
  employeeId: string;
  employeeName: string;
  managerName: string;
  month: string;
  year: number;
  teamwork: number;
  innovation: number;
  communication: number;
  overallScore: number;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Performance() {
  const { currentUser } = useApp();
  const [performances, setPerformances] = useState<PerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<PerformanceData>>({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    teamwork: 0,
    innovation: 0,
    communication: 0,
  });

  const isHR = currentUser?.role === 'hr_manager';
  const isManager = currentUser?.roleLabel?.includes('Manager');

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    try {
      let perfQuery: any = {};
      if (!isHR && !isManager && currentUser) {
        perfQuery = { employeeId: currentUser.employeeId };
      } else if (!isHR && isManager && currentUser) {
        perfQuery = { managerName: currentUser.name };
      }
      
      const [perfRes, empRes] = await Promise.all([
        performanceAPI.getAll(perfQuery),
        employeesAPI.getAll()
      ]);
      if (perfRes.success && perfRes.data) setPerformances(perfRes.data);
      if (empRes.success && empRes.data) {
        if (isManager && !isHR) {
          setEmployees(empRes.data.filter((e: any) => e.manager === currentUser?.name));
        } else {
          setEmployees(empRes.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await performanceAPI.update(editingId, formData);
      } else {
        await performanceAPI.create(formData);
      }
      await fetchData();
      setShowModal(false);
      setEditingId(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
      await performanceAPI.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const handleEdit = (perf: PerformanceData) => {
    setEditingId(perf.id || null);
    setFormData(perf);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      teamwork: 0,
      innovation: 0,
      communication: 0,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-secondary)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Performance Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track and manage employee performance</p>
        </div>
        {(isManager || isHR) && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{ background: 'var(--primary-gradient)', color: 'white' }}
          >
            <Plus size={16} /> Add Performance
          </button>
        )}
      </div>

      <div className="grid gap-4">
        {performances.map((perf, idx) => (
          <motion.div
            key={perf.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{perf.employeeName}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{perf.month} {perf.year} • Manager: {perf.managerName}</p>
              </div>
              {(isManager || isHR) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(perf)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(perf.id!)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Overall Score */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Overall Score</span>
                  <span className="text-sm font-bold" style={{ color: '#10B981' }}>{perf.overallScore}%</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-glass)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${perf.overallScore}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }}
                  />
                </div>
              </div>

              {/* Teamwork */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Teamwork</span>
                  <span className="text-sm font-bold" style={{ color: '#3B82F6' }}>{perf.teamwork}%</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-glass)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${perf.teamwork}%`, background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
                  />
                </div>
              </div>

              {/* Innovation */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Innovation</span>
                  <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>{perf.innovation}%</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-glass)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${perf.innovation}%`, background: 'linear-gradient(90deg, #F59E0B, #FBBF24)' }}
                  />
                </div>
              </div>

              {/* Communication */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Communication</span>
                  <span className="text-sm font-bold" style={{ color: '#8B5CF6' }}>{perf.communication}%</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-glass)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${perf.communication}%`, background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 rounded-2xl w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingId ? 'Edit Performance' : 'Add Performance'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingId(null); resetForm(); }}
                className="p-2 rounded-lg hover:bg-white/10"
                style={{ color: 'var(--text-secondary)' }}
              >
                <Trash2 size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {((isManager && !isHR) ? true : true) && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Employee
                  </label>
                  <select
                    value={formData.employeeId || ''}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const emp = selectedValue ? employees.find(e => e.employeeId === selectedValue) : undefined;
                      setFormData(prev => ({
                        ...prev,
                        employeeId: selectedValue,
                        employeeName: emp?.name,
                        managerName: isHR ? emp?.manager : currentUser?.name,
                      }));
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-transparent outline-none border transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    required
                  >
                    <option value="">Select an employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.employeeId} style={{ color: 'black' }}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Month
                  </label>
                  <select
                    value={formData.month || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-transparent outline-none border transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    required
                  >
                    {months.map(m => (
                      <option key={m} value={m} style={{ color: 'black' }}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Year
                  </label>
                  <input
                    type="number"
                    value={formData.year || new Date().getFullYear()}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl bg-transparent outline-none border transition-colors"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Teamwork (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.teamwork || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamwork: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl bg-transparent outline-none border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Innovation (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.innovation || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, innovation: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl bg-transparent outline-none border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                  Communication (0-100)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.communication || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, communication: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl bg-transparent outline-none border transition-colors"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ background: 'var(--primary-gradient)', color: 'white' }}
              >
                <Save size={16} /> {editingId ? 'Update' : 'Save'} Performance
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
