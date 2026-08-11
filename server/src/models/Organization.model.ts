import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  adminId?: mongoose.Types.ObjectId;
  trialStartDate: Date;
  trialEndDate: Date;
  isPaid: boolean;
  paymentDate?: Date;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  officeLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    radius: number;
  };
  attendanceSettings?: {
    checkInTime: string;
    checkOutTime: string;
    lateThreshold: string;
    geofencingEnabled: boolean;
    strictGeofenceEnforcement: boolean;
    autoClockOutOnExit: boolean;
    requireOutOfOfficeApproval: boolean;
    allowedGraceRadius: number;
    notifyHROnViolation: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User' },
  trialStartDate: { type: Date, required: true, default: Date.now },
  trialEndDate: { type: Date, required: true },
  isPaid: { type: Boolean, required: true, default: false },
  paymentDate: { type: Date },
  plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Basic' },
  officeLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    radius: { type: Number, default: 100 },
  },
  attendanceSettings: {
    checkInTime: { type: String, default: '09:00' },
    checkOutTime: { type: String, default: '18:00' },
    lateThreshold: { type: String, default: '09:15' },
    geofencingEnabled: { type: Boolean, default: true },
    strictGeofenceEnforcement: { type: Boolean, default: true },
    autoClockOutOnExit: { type: Boolean, default: true },
    requireOutOfOfficeApproval: { type: Boolean, default: true },
    allowedGraceRadius: { type: Number, default: 50 },
    notifyHROnViolation: { type: Boolean, default: true },
  },
}, { timestamps: true });

OrganizationSchema.pre<IOrganization>('save', function(next) {
  if (this.isNew || this.isModified('trialStartDate')) {
    const trialStart = this.trialStartDate || new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 30);
    this.trialEndDate = trialEnd;
  }
  if (!this.attendanceSettings) {
    this.attendanceSettings = {
      checkInTime: '09:00',
      checkOutTime: '18:00',
      lateThreshold: '09:15',
      geofencingEnabled: true,
      strictGeofenceEnforcement: true,
      autoClockOutOnExit: true,
      requireOutOfOfficeApproval: true,
      allowedGraceRadius: 50,
      notifyHROnViolation: true,
    };
  } else {
    if (typeof this.attendanceSettings.geofencingEnabled === 'undefined') this.attendanceSettings.geofencingEnabled = true;
    if (typeof this.attendanceSettings.strictGeofenceEnforcement === 'undefined') this.attendanceSettings.strictGeofenceEnforcement = true;
    if (typeof this.attendanceSettings.autoClockOutOnExit === 'undefined') this.attendanceSettings.autoClockOutOnExit = true;
    if (typeof this.attendanceSettings.requireOutOfOfficeApproval === 'undefined') this.attendanceSettings.requireOutOfOfficeApproval = true;
    if (typeof this.attendanceSettings.allowedGraceRadius === 'undefined') this.attendanceSettings.allowedGraceRadius = 50;
    if (typeof this.attendanceSettings.notifyHROnViolation === 'undefined') this.attendanceSettings.notifyHROnViolation = true;
  }
  next();
});

OrganizationSchema.virtual('id').get(function(this: IOrganization) {
  return this._id.toHexString();
});

OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
