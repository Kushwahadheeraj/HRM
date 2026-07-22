import mongoose, { Schema, Document } from 'mongoose';

interface IBreak {
  type: 'lunch' | 'tea' | 'meeting' | 'other';
  startTime: string;
  endTime?: string;
  duration?: number; // In minutes
}

export interface IAttendanceRecord extends Document {
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'remote' | 'leave' | 'holiday' | 'pending';
  department: string;
  overtime: number;
  workingHours: number; // In hours
  totalBreakTime: number; // In minutes
  method: 'face' | 'gps' | 'qr' | 'biometric' | 'manual' | 'image';
  shiftId?: string;
  organizationId: mongoose.Types.ObjectId;
  // Additional fields for attendance methods
  clockInImage?: string;
  clockOutImage?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  qrCodeData?: string;
  biometricId?: string;
  verifiedBy?: string;
  notes?: string;
  breaks: IBreak[];
  // Approval fields for GPS
  isPendingApproval?: boolean;
  approvalStatus?: 'approved' | 'rejected' | 'pending';
  approvedBy?: string;
  approvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttendanceSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  date: { type: String, required: true },
  clockIn: { type: String, default: '' },
  clockOut: { type: String, default: '' },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'half-day', 'remote', 'leave', 'holiday', 'pending'],
    required: true
  },
  department: { type: String, required: true },
  overtime: { type: Number, default: 0 },
  workingHours: { type: Number, default: 0 },
  totalBreakTime: { type: Number, default: 0 },
  method: {
    type: String,
    enum: ['face', 'gps', 'qr', 'biometric', 'manual', 'image'],
    required: true
  },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  // Additional fields
  clockInImage: { type: String },
  clockOutImage: { type: String },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  qrCodeData: { type: String },
  biometricId: { type: String },
  verifiedBy: { type: String },
  notes: { type: String },
  breaks: [{
    type: { type: String, enum: ['lunch', 'tea', 'meeting', 'other'], required: true },
    startTime: { type: String, required: true },
    endTime: { type: String },
    duration: { type: Number, default: 0 }
  }],
  // Approval fields
  isPendingApproval: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
  approvedBy: { type: String },
  approvedAt: { type: Date }
}, { timestamps: true });

AttendanceSchema.virtual('id').get(function(this: IAttendanceRecord) {
  return this._id.toHexString();
});

AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

export default mongoose.model<IAttendanceRecord>('Attendance', AttendanceSchema);