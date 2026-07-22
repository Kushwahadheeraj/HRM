import mongoose, { Schema, Document } from 'mongoose';

export interface IPayrollRecord extends Document {
  employeeId: string;
  employeeName: string;
  department: string;
  baseSalary: number;
  hra: number;
  bonus: number;
  otherAllowances: number;
  overtimePay: number;
  totalOvertimeHours: number;
  attendanceDeductions: number;
  leaveDeductions: number;
  otherDeductions: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  month: string;
  year: number;
  attendanceDays: number;
  absentDays: number;
  leaveDays: number;
  status: 'processed' | 'pending' | 'paid';
  organizationId: mongoose.Types.ObjectId;
}

const PayrollSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  hra: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  otherAllowances: { type: Number, default: 0 },
  overtimePay: { type: Number, default: 0 },
  totalOvertimeHours: { type: Number, default: 0 },
  attendanceDeductions: { type: Number, default: 0 },
  leaveDeductions: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  totalEarnings: { type: Number, required: true },
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  attendanceDays: { type: Number, default: 0 },
  absentDays: { type: Number, default: 0 },
  leaveDays: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['processed', 'pending', 'paid'],
    default: 'pending'
  },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

PayrollSchema.virtual('id').get(function(this: IPayrollRecord) {
  return this._id.toHexString();
});

PayrollSchema.set('toJSON', { virtuals: true });
PayrollSchema.set('toObject', { virtuals: true });

export default mongoose.model<IPayrollRecord>('Payroll', PayrollSchema);