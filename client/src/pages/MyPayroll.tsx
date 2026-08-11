import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { motion } from 'framer-motion';
import { IndianRupee, Download, TrendingUp, Calendar, FileText, CreditCard, PieChart, Loader2 } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { payrollAPI, organizationAPI } from '../lib/api';
import PayslipPDF from '../components/PayslipPDF';
import { useCurrency } from '../lib/currency';

// Types for My Payroll
interface SalaryHistoryItem {
  month: string;
  amount: number;
}

interface BreakdownItem {
  name: string;
  value: number;
  color: string;
}

interface Payslip {
  id?: string;
  month: string;
  gross: number;
  deductions: number;
  net: number;
  status: string;
  baseSalary?: number;
  hra?: number;
  bonus?: number;
  otherAllowances?: number;
  overtimePay?: number;
  totalOvertimeHours?: number;
  employeeName?: string;
  employeeId?: string;
  department?: string;
  year?: number;
  totalEarnings?: number;
  totalDeductions?: number;
  attendanceDays?: number;
  absentDays?: number;
  leaveDays?: number;
  attendanceDeductions?: number;
  leaveDeductions?: number;
  otherDeductions?: number;
}

export default function MyPayroll() {
  const { currentUser } = useApp();
  const { formatCurrency, currencySymbol, isIndian } = useCurrency();
  const [salaryHistory, setSalaryHistory] = useState<SalaryHistoryItem[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<{ name: string; officeLocation?: { address?: string } } | null>(null);
  const downloadLinksRef = React.useRef<{ [key: string]: HTMLAnchorElement | null }>({});

  useEffect(() => {
    const fetchPayrollData = async () => {
      if (!currentUser?.employeeId) return;
      setLoading(true);
      try {
        let orgData: { name: string; officeLocation?: { address?: string } } | null = null;

        try {
          const orgRes = await organizationAPI.getSettings();
          console.log('📥 [MyPayroll] organizationAPI.getSettings() response:', orgRes);
          if (orgRes.success && orgRes.data) {
            orgData = orgRes.data;
            console.log('✅ [MyPayroll] Using organization from API:', {
              name: orgData.name,
              address: orgData.officeLocation?.address,
            });
          }
        } catch (orgErr) {
          console.warn('⚠️ [MyPayroll] organizationAPI.getSettings() failed, fallback to localStorage:', orgErr);
        }

        // Fallback 1: check if login/auth response mein organization data attached hai
        if (!orgData && currentUser && (currentUser as any).organization) {
          orgData = (currentUser as any).organization;
          console.log('✅ [MyPayroll] Using organization from currentUser:', orgData);
        }

        // Fallback 2: check localStorage ke saved user mein kya organization data hai
        if (!orgData) {
          try {
            const saved = localStorage.getItem('currentUser');
            if (saved) {
              const parsed = JSON.parse(saved);
              console.log('🔍 [MyPayroll] localStorage currentUser keys:', Object.keys(parsed));
              console.log('🔍 [MyPayroll] localStorage organizationId:', parsed.organizationId);
              console.log('🔍 [MyPayroll] localStorage organization:', (parsed as any).organization);
            }
          } catch (e) { /* ignore */ }
        }

        if (orgData) setOrganization(orgData);

        const payrollRes = await payrollAPI.getByEmployee(currentUser.employeeId);
        if (payrollRes.success && payrollRes.data) {
          const transformedHistory = payrollRes.data.map((item: any) => ({
            month: item.month.split(' ')[0].substring(0, 3),
            amount: item.netSalary || 0
          }));
          const transformedPayslips = payrollRes.data.map((item: any) => ({
            id: item.id,
            month: item.month,
            gross: item.totalEarnings || 0,
            deductions: item.totalDeductions || 0,
            net: item.netSalary || 0,
            status: item.status,
            baseSalary: item.baseSalary || 0,
            hra: item.hra || 0,
            bonus: item.bonus || 0,
            otherAllowances: item.otherAllowances || 0,
            overtimePay: item.overtimePay || 0,
            totalOvertimeHours: item.totalOvertimeHours || 0,
            employeeName: item.employeeName || currentUser?.name,
            employeeId: item.employeeId || currentUser?.employeeId,
            department: item.department || currentUser?.department,
            year: item.year,
            totalEarnings: item.totalEarnings,
            totalDeductions: item.totalDeductions,
            attendanceDays: item.attendanceDays || 0,
            absentDays: item.absentDays || 0,
            leaveDays: item.leaveDays || 0,
            attendanceDeductions: item.attendanceDeductions || 0,
            leaveDeductions: item.leaveDeductions || 0,
            otherDeductions: item.otherDeductions || 0
          }));
          setSalaryHistory(transformedHistory);
          setPayslips(transformedPayslips);
        }
      } catch (error) {
        console.error('Error fetching payroll:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayrollData();
  }, [currentUser?.employeeId]);

  const handleDownloadAll = async () => {
    // Download all paid payslips one by one
    const paidPayslips = payslips.filter(slip => slip.status === 'paid');
    if (paidPayslips.length === 0) {
      alert('No paid payslips available to download.');
      return;
    }
    for (let i = 0; i < paidPayslips.length; i++) {
      const slip = paidPayslips[i];
      if (downloadLinksRef.current[slip.month]) {
        downloadLinksRef.current[slip.month]?.click();
        // Wait a bit before next download to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  // Calculate payroll summary from real data
  const payrollSummary = (() => {
    const latestPayroll = payslips[0];
    const ytdEarnings = payslips.reduce((sum, slip) => sum + (slip.net || 0), 0);
    const ytdOvertime = payslips.reduce((sum, slip) => sum + (slip.overtimePay || 0), 0);
    
    if (!latestPayroll) {
      return [];
    }
    
    const summaryCards = [
      { label: 'Monthly Gross', value: formatCurrency(latestPayroll.gross || 0), icon: IndianRupee, color: '#3B82F6' },
      { label: 'Net Salary', value: formatCurrency(latestPayroll.net || 0), icon: CreditCard, color: '#10B981' },
      { label: 'Deductions', value: formatCurrency(latestPayroll.deductions || 0), icon: TrendingUp, color: '#EF4444' },
      { label: 'YTD Earnings', value: formatCurrency(ytdEarnings || 0), icon: Calendar, color: '#F59E0B' },
    ];
    
    // Add overtime card if latest payroll has overtime
    if (latestPayroll.overtimePay && latestPayroll.overtimePay > 0) {
      summaryCards.push({
        label: `Overtime (${latestPayroll.totalOvertimeHours}h)`,
        value: formatCurrency(latestPayroll.overtimePay || 0),
        icon: TrendingUp,
        color: '#EC4899'
      });
    }
    
    return summaryCards;
  })();

  // Calculate salary breakdown from real data
  const breakdown = (() => {
    const latestPayroll = payslips[0];
    if (!latestPayroll) {
      return [];
    }

    const total = latestPayroll.gross;
    const basic = latestPayroll.baseSalary ? Math.round((latestPayroll.baseSalary / total) * 100) : 0;
    const hra = latestPayroll.hra ? Math.round((latestPayroll.hra / total) * 100) : 0;
    const bonus = latestPayroll.bonus ? Math.round((latestPayroll.bonus / total) * 100) : 0;
    const other = latestPayroll.otherAllowances ? Math.round((latestPayroll.otherAllowances / total) * 100) : 0;
    const overtime = latestPayroll.overtimePay ? Math.round((latestPayroll.overtimePay / total) * 100) : 0;

    const breakdownData = [
      { name: 'Basic', value: basic, color: '#3B82F6' },
      { name: 'HRA', value: hra, color: '#10B981' },
      { name: 'Bonus', value: bonus, color: '#F59E0B' },
      { name: 'Other', value: other, color: '#8B5CF6' },
    ];
    
    // Add overtime to breakdown only if it's greater than 0
    if (overtime > 0) {
      breakdownData.push({ name: 'Overtime', value: overtime, color: '#EC4899' });
    }

    return breakdownData;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Payroll</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>View salary details and download payslips</p>
        </div>
        <button onClick={handleDownloadAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
          <Download size={16} /> Download All
        </button>
      </div>

      {/* Summary Cards */}
      {payrollSummary.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {payrollSummary.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5 rounded-2xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: card.color + '15' }}>
                  <Icon size={20} style={{ color: card.color }} />
                </div>
                <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{card.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{card.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {salaryHistory.length > 0 && (
          <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Salary Trend</h3>
            <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>Net salary over last 6 months</p>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salaryHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => currencySymbol + (v / 1000) + 'k'} />
                <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="amount" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {breakdown.length > 0 && (
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Salary Breakdown</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Current month</p>
            <ResponsiveContainer width="100%" height={180}>
              <RechartsPie>
                <Pie data={breakdown} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {breakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {breakdown.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: d.color }} /><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span></div>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Payslips</h3>
        <div className="space-y-3">
          {payslips.map((slip, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                  <FileText size={20} style={{ color: '#3B82F6' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{slip.month}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Net: {formatCurrency(slip.net || 0)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Gross</p>
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{formatCurrency(slip.gross || 0)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Deductions</p>
                  <p className="text-sm" style={{ color: '#EF4444' }}>-{formatCurrency(slip.deductions || 0)}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase" style={{ background: slip.status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: slip.status === 'paid' ? '#10B981' : '#3B82F6' }}>{slip.status}</span>
                {slip.status === 'paid' ? (
                  <PDFDownloadLink 
                    document={<PayslipPDF data={{
                      employeeName: slip.employeeName || '',
                      employeeId: slip.employeeId || '',
                      department: slip.department || '',
                      month: slip.month.split(' ')[0],
                      year: slip.year || new Date().getFullYear(),
                      baseSalary: slip.baseSalary || 0,
                      hra: slip.hra || 0,
                      bonus: slip.bonus || 0,
                      otherAllowances: slip.otherAllowances || 0,
                      overtimePay: slip.overtimePay || 0,
                      totalEarnings: slip.totalEarnings || slip.gross,
                      attendanceDeductions: slip.attendanceDeductions || 0,
                      leaveDeductions: slip.leaveDeductions || 0,
                      otherDeductions: slip.otherDeductions || 0,
                      totalDeductions: slip.totalDeductions || slip.deductions,
                      netSalary: slip.net,
                      attendanceDays: slip.attendanceDays || 0,
                      absentDays: slip.absentDays || 0,
                      leaveDays: slip.leaveDays || 0,
                      currencySymbol,
                      isIndian,
                      companyName: organization?.name,
                      companyAddress: organization?.officeLocation?.address,
                    }} />} 
                    fileName={`Payslip_${slip.month}.pdf`}
                    className="p-2 rounded-lg hover:bg-white/10"
                    style={{ color: 'var(--text-secondary)' }}
                    ref={(el: any) => {
                      if (el) {
                        downloadLinksRef.current[slip.month] = el as HTMLAnchorElement;
                      }
                    }}
                  >
                    {({ loading }) => loading ? 'Generating...' : <Download size={16} />}
                  </PDFDownloadLink>
                ) : (
                  <button disabled className="p-2 rounded-lg opacity-50 cursor-not-allowed" style={{ color: 'var(--text-secondary)' }}>
                    <Download size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
