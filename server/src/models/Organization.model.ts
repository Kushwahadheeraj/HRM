import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  adminId: mongoose.Types.ObjectId;
  trialStartDate: Date;
  trialEndDate: Date;
  isPaid: boolean;
  paymentDate?: Date;
  plan?: 'Basic' | 'Pro' | 'Enterprise';
  // Office settings
  officeLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    radius: number; // in meters
  };
  // Attendance time settings
  attendanceSettings?: {
    checkInTime: string; // e.g., '09:00'
    checkOutTime: string; // e.g., '18:00'
    lateThreshold: string; // e.g., '09:15'
  };
  createdAt?: Date;
  updatedAt?: Date;
}

const OrganizationSchema: Schema = new Schema({
  name: { type: String, required: true },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  trialStartDate: { type: Date, required: true, default: Date.now },
  trialEndDate: { type: Date, required: true },
  isPaid: { type: Boolean, required: true, default: false },
  paymentDate: { type: Date },
  plan: { type: String, enum: ['Basic', 'Pro', 'Enterprise'], default: 'Basic' },
  officeLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    radius: { type: Number, default: 100 } // default 100 meters
  },
  attendanceSettings: {
    checkInTime: { type: String, default: '09:00' },
    checkOutTime: { type: String, default: '18:00' },
    lateThreshold: { type: String, default: '09:15' }
  }
}, { timestamps: true });

// Calculate trial end date (30 days from start)
OrganizationSchema.pre<IOrganization>('save', function(next) {
  if (this.isNew || this.isModified('trialStartDate')) {
    const trialStart = this.trialStartDate || new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + 30); // Add 30 days
    this.trialEndDate = trialEnd;
  }
  next();
});

OrganizationSchema.virtual('id').get(function(this: IOrganization) {
  return this._id.toHexString();
});

OrganizationSchema.set('toJSON', { virtuals: true });
OrganizationSchema.set('toObject', { virtuals: true });

export default mongoose.model<IOrganization>('Organization', OrganizationSchema);
