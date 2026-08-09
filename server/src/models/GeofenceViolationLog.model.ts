import mongoose, { Schema, Document } from 'mongoose';

export interface IGeofenceViolationLog extends Document {
  employeeId: string;
  employeeName: string;
  attendanceId?: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  violationType: 'clock-in-blocked' | 'auto-clocked-out' | 'area-exit-without-approval' | 're-entry-blocked';
  latitude: number;
  longitude: number;
  address?: string;
  distanceFromOffice: number;
  allowedRadius: number;
  hasActiveApproval: boolean;
  autoClockedOut: boolean;
  notes?: string;
  createdAt?: Date;
}

const GeofenceViolationLogSchema: Schema = new Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  attendanceId: { type: Schema.Types.ObjectId, ref: 'Attendance' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  violationType: {
    type: String,
    enum: ['clock-in-blocked', 'auto-clocked-out', 'area-exit-without-approval', 're-entry-blocked'],
    required: true,
  },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String },
  distanceFromOffice: { type: Number, required: true },
  allowedRadius: { type: Number, required: true },
  hasActiveApproval: { type: Boolean, required: true },
  autoClockedOut: { type: Boolean, default: false },
  notes: { type: String },
}, { timestamps: true });

GeofenceViolationLogSchema.virtual('id').get(function(this: IGeofenceViolationLog) {
  return this._id.toHexString();
});

GeofenceViolationLogSchema.set('toJSON', { virtuals: true });
GeofenceViolationLogSchema.set('toObject', { virtuals: true });

GeofenceViolationLogSchema.index({ employeeId: 1, createdAt: -1 });
GeofenceViolationLogSchema.index({ organizationId: 1, violationType: 1, createdAt: -1 });

export default mongoose.model<IGeofenceViolationLog>('GeofenceViolationLog', GeofenceViolationLogSchema);
