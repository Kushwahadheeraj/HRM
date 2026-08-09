import mongoose, { Schema, Document } from 'mongoose';

interface IBreak {
  type: 'lunch' | 'tea' | 'meeting' | 'other';
  startTime: string;
  endTime?: string;
  duration?: number;
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
  workingHours: number;
  totalBreakTime: number;
  method: 'face' | 'gps' | 'qr' | 'biometric' | 'manual' | 'image';
  shiftId?: string;
  organizationId: mongoose.Types.ObjectId;
  clockInImage?: string;
  clockOutImage?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
    address?: string;
  };
  qrCodeData?: string;
  biometricId?: string;
  verifiedBy?: string;
  notes?: string;
  breaks: IBreak[];
  isPendingApproval?: boolean;
  approvalStatus?: 'approved' | 'rejected' | 'pending';
  approvedBy?: string;
  approvedAt?: Date;
  geofenceStatus?: 'inside' | 'outside' | 'exited-without-approval' | 'exited-with-approval';
  clockInDistance?: number;
  lastDistance?: number;
  wasAutoClockedOut?: boolean;
  autoClockOutReason?: string;
  outOfOfficeApprovalId?: mongoose.Types.ObjectId;
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
  clockInImage: { type: String },
  clockOutImage: { type: String },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  clockOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  lastKnownLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date,
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
  isPendingApproval: { type: Boolean, default: false },
  approvalStatus: { type: String, enum: ['approved', 'rejected', 'pending'], default: 'pending' },
  approvedBy: { type: String },
  approvedAt: { type: Date },
  geofenceStatus: { type: String, enum: ['inside', 'outside', 'exited-without-approval', 'exited-with-approval'], default: 'inside' },
  clockInDistance: { type: Number },
  lastDistance: { type: Number },
  wasAutoClockedOut: { type: Boolean, default: false },
  autoClockOutReason: { type: String },
  outOfOfficeApprovalId: { type: Schema.Types.ObjectId, ref: 'OutOfOfficeApproval' },
}, { timestamps: true });

AttendanceSchema.virtual('id').get(function(this: IAttendanceRecord) {
  return this._id.toHexString();
});

AttendanceSchema.set('toJSON', { virtuals: true });
AttendanceSchema.set('toObject', { virtuals: true });

AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ organizationId: 1, date: 1 });
AttendanceSchema.index({ geofenceStatus: 1 });
AttendanceSchema.index({ wasAutoClockedOut: 1, createdAt: -1 });

export default mongoose.model<IAttendanceRecord>('Attendance', AttendanceSchema);
