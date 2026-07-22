import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { UserPlus, Briefcase, Users, Calendar, MapPin, Star, ArrowRight, X, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { recruitmentAPI } from '../lib/api';

interface OpenPosition {
  title: string;
  department: string;
  location: string;
  applicants: number;
  posted: string;
  urgency: 'high' | 'medium' | 'low';
}

interface Candidate {
  name: string;
  role: string;
  stage: string;
  rating: number;
  applied: string;
}

interface StageData {
  stage: string;
  count: number;
  color: string;
}

interface SourceData {
  name: string;
  value: number;
  color: string;
}

export default function Recruitment() {
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pipelineData, setPipelineData] = useState<StageData[]>([]);
  const [sourceData, setSourceData] = useState<SourceData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    jobTitle: '',
    department: '',
    location: '',
    jobType: 'full-time',
    experience: '',
    description: '',
    requirements: '',
    responsibilities: '',
    salary: '',
  });

  const formatDate = (dateStr: Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days / 7)} weeks ago`;
  };

  const formatShortDate = (dateStr: Date) => {
    const date = new Date(dateStr);
    return `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [positionsRes, candidatesRes, statsRes] = await Promise.all([
          recruitmentAPI.getAll(),
          recruitmentAPI.getCandidates(),
          recruitmentAPI.getDashboardStats(),
        ]);

        if (positionsRes.success && positionsRes.data) {
          const transformed = positionsRes.data.map((job: any) => ({
            title: job.jobTitle,
            department: job.department,
            location: job.location,
            applicants: job.applicants,
            posted: formatDate(job.createdAt),
            urgency: (job.status === 'open' ? 'high' : 'low') as 'high' | 'medium' | 'low',
          }));
          setOpenPositions(transformed);
        }

        if (candidatesRes.success && candidatesRes.data) {
          const transformed = candidatesRes.data.map((c: any) => ({
            name: c.name,
            role: c.role,
            stage: c.stage,
            rating: c.rating,
            applied: formatShortDate(c.applicationDate),
          }));
          setCandidates(transformed);
        }

        if (statsRes.success && statsRes.data) {
          setPipelineData(statsRes.data.pipelineData);
          setSourceData(statsRes.data.sourceData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recruitmentAPI.create({
        ...formData,
        requirements: formData.requirements.split(',').map(r => r.trim()).filter(r => r),
        responsibilities: formData.responsibilities.split(',').map(r => r.trim()).filter(r => r),
      });
      setIsModalOpen(false);
      setFormData({
        jobTitle: '',
        department: '',
        location: '',
        jobType: 'full-time',
        experience: '',
        description: '',
        requirements: '',
        responsibilities: '',
        salary: '',
      });

      const res = await recruitmentAPI.getAll();
      if (res.success && res.data) {
        const transformed = res.data.map((job: any) => ({
          title: job.jobTitle,
          department: job.department,
          location: job.location,
          applicants: job.applicants,
          posted: formatDate(job.createdAt),
          urgency: (job.status === 'open' ? 'high' : 'low') as 'high' | 'medium' | 'low',
        }));
        setOpenPositions(transformed);
      }
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Recruitment Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track hiring pipeline and manage candidates</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
        >
          <UserPlus size={16} /> Post New Job
        </button>
      </div>

      {pipelineData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {pipelineData.map((stage, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-4 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: stage.color + '15' }}>
                <Users size={20} style={{ color: stage.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{stage.count}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stage.stage}</p>
              <div className="w-full h-1 rounded-full mt-3" style={{ background: 'var(--bg-glass)' }}>
                <div className="h-full rounded-full" style={{ width: Math.min(stage.count / 45 * 100, 100) + '%', background: stage.color }} />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Hiring Fun</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Candidate pipeline overview</p>
          {pipelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis dataKey="stage" type="category" stroke="rgba(255,255,255,0.3)" fontSize={12} width={80} />
                <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {pipelineData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No pipeline data available</div>
          )}
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Application Sources</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Where candidates come from</p>
          {sourceData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {sourceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {sourceData.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: s.color }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.name}</span></div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>No source data available</div>
          )}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Open Positions</h3>
        {openPositions.length > 0 ? (
          <div className="grid gap-4">
            {openPositions.map((pos, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-xl transition-all hover:scale-[1.01] cursor-pointer" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                      <Briefcase size={20} style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pos.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span>{pos.department}</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{pos.location}</span>
                        <span className="flex items-center gap-1"><Calendar size={10} />{pos.posted}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{pos.applicants} applicants</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: pos.urgency === 'high' ? 'rgba(239, 68, 68, 0.1)' : pos.urgency === 'medium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: pos.urgency === 'high' ? '#EF4444' : pos.urgency === 'medium' ? '#F59E0B' : '#10B981' }}>{pos.urgency}</span>
                    <ArrowRight size={16} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No open positions yet</div>
        )}
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Recent Candidates</h3>
        {candidates.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {['Candidate', 'Position', 'Stage', 'Rating', 'Applied'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold pb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.map((c, i) => (
                  <tr key={i} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: ['#3B82F6', '#F97316', '#10B981', '#8B5CF6', '#EF4444'][i % 5] }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="text-xs py-3" style={{ color: 'var(--text-secondary)' }}>{c.role}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: c.stage === 'Offer' ? 'rgba(16, 185, 129, 0.1)' : c.stage === 'Interview' ? 'rgba(249, 115, 22, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: c.stage === 'Offer' ? '#10B981' : c.stage === 'Interview' ? '#F97316' : '#3B82F6' }}>{c.stage}</span>
                    </td>
                    <td className="py-3"><div className="flex items-center gap-1"><Star size={12} fill="#F59E0B" stroke="#F59E0B" /><span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{c.rating}</span></div></td>
                    <td className="text-xs py-3" style={{ color: 'var(--text-muted)' }}>{c.applied}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No candidates yet</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Post New Job</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-white/10">
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Job Type</label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="full-time" style={{ color: 'black' }}>Full-time</option>
                    <option value="part-time" style={{ color: 'black' }}>Part-time</option>
                    <option value="contract" style={{ color: 'black' }}>Contract</option>
                    <option value="internship" style={{ color: 'black' }}>Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 2-5 years"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Salary</label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., $80k-100k"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Job Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Requirements (comma separated)</label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="e.g., React, JavaScript, 2+ years exp"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Responsibilities (comma separated)</label>
                <textarea
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  placeholder="e.g., Develop features, Review PRs, Mentor juniors"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-900/50 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium transition-all hover:bg-white/10"
                  style={{ color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #2563EB)' }}
                >
                  <CheckCircle2 size={16} />
                  Post Job
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
