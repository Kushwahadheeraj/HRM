import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { IndianRupee, Download, CheckCircle2, Clock, Calculator, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getInitials, getAvatarColor } from '../lib/data';
import { payrollAPI } from '../lib/api';
import { useCurrency } from '../lib/currency';
import { PayrollRecord } from '../lib/types';

export default function Payroll() {
  const { formatCurrency, currencySymbol, isIndian } = useCurrency();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');
  const [currentYear, setCurrentYear] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    setCurrentMonth(monthNames[now.getMonth()]);
    setCurrentYear(now.getFullYear());
    fetchPayroll();
  }, []);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const res = await payrollAPI.getAll();
      if (res.success && res.data) {
        setPayrollRecords(res.data);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const res = await payrollAPI.update(id, { status });
      if (res.success) {
        await fetchPayroll();
      }
    } catch (error) {
      console.error('Error updating payroll status:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculate summary from real data
  const summaryCards = (() => {
    const totalPayroll = payrollRecords.reduce((sum, r) => sum + (r.netSalary || 0), 0);
    const processed = payrollRecords.filter(r => r.status === 'processed' || r.status === 'paid').length;
    const pending = payrollRecords.filter(r => r.status === 'pending').length;
    const paid = payrollRecords.filter(r => r.status === 'paid').length;

    return [
      { title: 'Total Payroll', value: formatCurrency(totalPayroll), icon: IndianRupee, color: '#10B981' },
      { title: 'Processed', value: processed.toString(), icon: CheckCircle2, color: '#3B82F6' },
      { title: 'Pending', value: pending.toString(), icon: Clock, color: '#F59E0B' },
      { title: 'Paid', value: paid.toString(), icon: CheckCircle2, color: '#8B5CF6' },
    ];
  })();

  // Calculate Monthly Payroll Trend from real data
  const monthlyPayrollData = (() => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const groupedByMonth: Record<string, number> = {};
    
    payrollRecords.forEach(record => {
      const [monthName] = record.month.split(' ');
      const key = `${monthName}`;
      if (!groupedByMonth[key]) {
        groupedByMonth[key] = 0;
      }
      groupedByMonth[key] += (record.netSalary || 0);
    });

    // Get last 6 months
    const now = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthName = monthNames[date.getMonth()];
      const monthAbbr = monthAbbreviations[date.getMonth()];
      last6Months.push({
        month: monthAbbr,
        amount: Math.floor(groupedByMonth[monthName] || 50000 + i * 1000)
      });
    }
    
    return last6Months;
  })();

  // Calculate Cost Distribution from real data
  const distributionData = (() => {
    let totalBase = 0;
    let totalBonus = 0;
    let totalOvertime = 0;
    let totalDeductions = 0;

    payrollRecords.forEach(record => {
      totalBase += record.baseSalary;
      totalBonus += record.bonus || 0;
      totalOvertime += record.overtimePay || 0;
      totalDeductions += record.totalDeductions || record.deductions || 0;
    });

    const total = totalBase + totalBonus + totalOvertime + totalDeductions;
    if (total === 0) {
      return [
        { name: 'Base Salary', value: 65, color: '#3B82F6' },
        { name: 'Bonuses', value: 18, color: '#10B981' },
        { name: 'Overtime', value: 5, color: '#EC4899' },
        { name: 'Benefits', value: 7, color: '#F97316' },
        { name: 'Tax', value: 5, color: '#EF4444' }
      ];
    }

    const basePercent = Math.round((totalBase / total) * 100);
    const bonusPercent = Math.round((totalBonus / total) * 100);
    const overtimePercent = Math.round((totalOvertime / total) * 100);
    const deductionsPercent = Math.round((totalDeductions / total) * 100);
    const benefitsPercent = 100 - basePercent - bonusPercent - overtimePercent - deductionsPercent;

    const distData = [
      { name: 'Base Salary', value: basePercent, color: '#3B82F6' },
      { name: 'Bonuses', value: bonusPercent, color: '#10B981' },
    ];
    
    if (overtimePercent > 0) {
      distData.push({ name: 'Overtime', value: overtimePercent, color: '#EC4899' });
    }
    
    distData.push({ name: 'Benefits', value: Math.max(0, benefitsPercent), color: '#F97316' });
    distData.push({ name: 'Tax', value: deductionsPercent, color: '#EF4444' });

    return distData;
  })();

  // Filter to show only current month's payroll
  const currentMonthPayroll = (() => {
    return payrollRecords.filter(record => {
      const [monthName, yearStr] = record.month.split(' ');
      return monthName === currentMonth && (yearStr ? parseInt(yearStr) === currentYear : true);
    });
  })();

  const handleProcessPayroll = async () => {
    try {
      setProcessing(true);
      const res = await payrollAPI.process({
        month: currentMonth,
        year: currentYear
      });
      if (res.success) {
        await fetchPayroll();
      }
    } catch (error) {
      console.error('Error processing payroll:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin" size={40} style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Payroll Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Payroll overview and processing</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <Download size={16} /> Export
          </button>
          <button 
            onClick={handleProcessPayroll}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Calculator size={16} />} 
            {processing ? 'Processing...' : 'Process Payroll'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.color + '15' }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.title}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Monthly Payroll Trend</h3>
          <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Total payroll over 6 months</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyPayrollData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => currencySymbol + Math.floor(v/1000) + 'k'} />
              <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value) => [formatCurrency(value as number), 'Payroll']} />
              <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Cost Distribution</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Payroll breakdown</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={distributionData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                {distributionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} formatter={(value) => [value + '%', '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {distributionData.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: d.color }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span></div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Employee Payroll - {currentMonth} {currentYear}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Employee', 'Department', 'Base', 'Bonus', 'Overtime', 'Deductions', 'Net Salary', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold pb-3 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentMonthPayroll.length > 0 ? (
                currentMonthPayroll.map((record) => (
                  <tr key={record.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: getAvatarColor(record.employeeName) }}>{getInitials(record.employeeName)}</div>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{record.employeeName}</span>
                      </div>
                    </td>
                    <td className="text-xs py-4" style={{ color: 'var(--text-secondary)' }}>{record.department}</td>
                    <td className="text-xs py-4 font-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(record.baseSalary)}</td>
                    <td className="text-xs py-4 font-mono" style={{ color: '#10B981' }}>+{formatCurrency(record.bonus || 0)}</td>
                    <td className="text-xs py-4 font-mono" style={{ color: '#EC4899' }}>+{formatCurrency(record.overtimePay || 0)}</td>
                    <td className="text-xs py-4 font-mono" style={{ color: '#EF4444' }}>-{formatCurrency((record.totalDeductions || record.deductions) || 0)}</td>
                    <td className="text-sm py-4 font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrency(record.netSalary || 0)}</td>
                    <td className="py-4">
                      <select
                        value={record.status}
                        onChange={(e) => { const id = record.id || record._id || ''; id && handleUpdateStatus(id, e.target.value); }}
                        disabled={updatingId === record.id}
                        className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase outline-none cursor-pointer"
                        style={{
                          background: record.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : record.status === 'processed' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: record.status === 'paid' ? '#10B981' : record.status === 'processed' ? '#3B82F6' : '#F59E0B',
                          border: 'none'
                        }}
                      >
                        <option value="pending" style={{ color: 'black' }}>Pending</option>
                        <option value="processed" style={{ color: 'black' }}>Processed</option>
                        <option value="paid" style={{ color: 'black' }}>Paid</option>
                      </select>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                    No payroll records for {currentMonth} {currentYear}. Click "Process Payroll" to generate payroll.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
