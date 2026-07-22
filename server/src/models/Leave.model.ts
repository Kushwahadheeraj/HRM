import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveRequest extends Document {
  employeeId: string;
  employeeName: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'remote';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  department: string;
  organizationId: mongoose.Types.ObjectId;
}

const LeaveSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  type: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'remote'],
    required: true
  },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  department: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

// Add virtual id field
LeaveSchema.virtual('id').get(function(this: ILeaveRequest) {
  return this._id.toHexString();
});

// Ensure virtual fields are included when converting to JSON
LeaveSchema.set('toJSON', { virtuals: true });
LeaveSchema.set('toObject', { virtuals: true });

export default mongoose.model<ILeaveRequest>('Leave', LeaveSchema);