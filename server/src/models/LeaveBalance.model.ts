import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaveBalance extends Document {
  employeeId: string;
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'remote';
  used: number;
  total: number;
  organizationId: mongoose.Types.ObjectId;
}

const LeaveBalanceSchema: Schema = new Schema({
  employeeId: { type: String, required: true, unique: false },
  type: {
    type: String,
    enum: ['annual', 'sick', 'personal', 'maternity', 'paternity', 'remote'],
    required: true
  },
  used: { type: Number, default: 0, required: true },
  total: { type: Number, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

LeaveBalanceSchema.index({ organizationId: 1, employeeId: 1, type: 1 }, { unique: true });

LeaveBalanceSchema.virtual('id').get(function(this: ILeaveBalance) {
  return this._id.toHexString();
});

LeaveBalanceSchema.set('toJSON', { virtuals: true });
LeaveBalanceSchema.set('toObject', { virtuals: true });

export default mongoose.model<ILeaveBalance>('LeaveBalance', LeaveBalanceSchema);
