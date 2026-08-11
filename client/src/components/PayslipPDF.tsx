import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  employeeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    fontSize: 10,
  },
  column: {
    width: '48%',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    color: '#666',
  },
  value: {
    width: '60%',
    fontWeight: 'medium',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  totalRow: {
    fontWeight: 'bold',
  },
  netPayRow: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  signature: {
    marginTop: 40,
    textAlign: 'right',
    fontSize: 10,
  },
});

interface PayslipData {
  employeeName: string;
  employeeId: string;
  department: string;
  month: string;
  year: number;
  baseSalary: number;
  hra: number;
  bonus: number;
  otherAllowances: number;
  overtimePay: number;
  totalEarnings: number;
  attendanceDeductions: number;
  leaveDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  attendanceDays: number;
  absentDays: number;
  leaveDays: number;
  currencySymbol?: string;
  isIndian?: boolean;
  companyName?: string;
  companyAddress?: string;
}

const PayslipPDF: React.FC<{ data: PayslipData }> = ({ data }) => {
  const { currencySymbol = '$', isIndian = false, companyName = 'Traxale HRM', companyAddress = '4th Floor, Office No. 401 Shree Ram Commercial Park Shardhapuri Phase 2, Kankar Khera. Meerut UP 250002' } = data;
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${Math.floor(amount).toLocaleString(isIndian ? 'en-IN' : 'en-US')}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.companyAddress}>{companyAddress}</Text>
          <Text style={styles.title}>Payslip for the month of {data.month} {data.year}</Text>
        </View>

        <View style={styles.employeeInfo}>
          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Emp ID:</Text>
              <Text style={styles.value}>{data.employeeId}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Employee Name:</Text>
              <Text style={styles.value}>{data.employeeName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Department:</Text>
              <Text style={styles.value}>{data.department}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Attendance Days:</Text>
              <Text style={styles.value}>{data.attendanceDays}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Leave Days:</Text>
              <Text style={styles.value}>{data.leaveDays}</Text>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Month:</Text>
              <Text style={styles.value}>{data.month} {data.year}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Absent Days:</Text>
              <Text style={styles.value}>{data.absentDays}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell]}>Earnings</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>Amount</Text>
            <Text style={[styles.tableCell]}>Deductions</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>Amount</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Basic</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.baseSalary)}</Text>
            <Text style={styles.tableCell}>PF</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.otherDeductions * 0.5)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>HRA</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.hra)}</Text>
            <Text style={styles.tableCell}>ESI</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.otherDeductions * 0.3)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Bonus</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.bonus)}</Text>
            <Text style={styles.tableCell}>PT</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.otherDeductions * 0.2)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Other Allowances</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.otherAllowances)}</Text>
            <Text style={styles.tableCell}>Attendance Deductions</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.attendanceDeductions)}</Text>
          </View>

          {data.overtimePay > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Overtime Pay</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.overtimePay)}</Text>
              <Text style={styles.tableCell}>Leave Deductions</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.leaveDeductions)}</Text>
            </View>
          )}

          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={[styles.tableCell]}>Total</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.totalEarnings)}</Text>
            <Text style={[styles.tableCell]}>Total</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }]}>{formatCurrency(data.totalDeductions)}</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.netPayRow]}>Net Pay</Text>
            <Text style={[styles.tableCell, { textAlign: 'right' }, styles.netPayRow]}>{formatCurrency(data.netSalary)}</Text>
            <Text style={styles.tableCell}></Text>
            <Text style={styles.tableCell}></Text>
          </View>
        </View>

        <View style={styles.signature}>
          <Text style={{ borderTopWidth: 1, borderTopColor: '#000', paddingTop: 5 }}>Signature</Text>
          <Text style={{ marginTop: 10 }}>{companyName}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PayslipPDF;
