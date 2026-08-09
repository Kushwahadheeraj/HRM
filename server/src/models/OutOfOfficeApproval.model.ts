import mongoose, { Schema, Document } from 'mongoose';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface IOutOfOfficeApproval extends Document {
  employeeId: string;
  employeeName: string;
  email?: string;
  department?: string;
  organizationId: mongoose.Types.ObjectId;
  reason: string;
  description?: string;
  requestDate: string;
  startTime: string;
  endTime: string;
  fullDay: boolean;
  requestedLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  cancelledBy?: string;
  cancelledAt?: Date;
  isCurrentlyActive: boolean;
  usedForAttendanceIds?: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const OutOfOfficeApprovalSchema: Schema = new Schema({
  employeeId: { type: String, required: true, index: true },
  employeeName: { type: String, required: true },
  email: { type: String },
  department: { type: String },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  reason: { type: String, required: true },
  description: { type: String },
  requestDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  fullDay: { type: Boolean, default: false },
  requestedLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired'],
    default: 'pending',
    index: true,
  },
  approvedBy: { type: String },
  approvedByName: { type: String },
  approvedAt: { type: Date },
  rejectedBy: { type: String },
  rejectedByName: { type: String },
  rejectedAt: { type: Date },
  rejectionReason: { type: String },
  cancelledBy: { type: String },
  cancelledAt: { type: Date },
  isCurrentlyActive: { type: Boolean, default: false, index: true },
  usedForAttendanceIds: [{ type: Schema.Types.ObjectId, ref: 'Attendance' }],
}, { timestamps: true });

OutOfOfficeApprovalSchema.virtual('id').get(function(this: IOutOfOfficeApproval) {
  return this._id.toHexString();
});

OutOfOfficeApprovalSchema.set('toJSON', { virtuals: true });
OutOfOfficeApprovalSchema.set('toObject', { virtuals: true });

OutOfOfficeApprovalSchema.index({ employeeId: 1, requestDate: 1 });
OutOfOfficeApprovalSchema.index({ organizationId: 1, approvalStatus: 1 });

export default mongoose.model<IOutOfOfficeApproval>('OutOfOfficeApproval', OutOfOfficeApprovalSchema);
