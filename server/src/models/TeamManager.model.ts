import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamManager extends Document {
  name: string;
  email: string;
  department: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'remote' | 'offline';
  joinDate: string;
  phone: string;
  employeeId: string;
  organizationId: mongoose.Types.ObjectId;
}

const TeamManagerSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['active', 'on-leave', 'remote', 'offline'], default: 'active' },
  joinDate: { type: String, required: true },
  phone: { type: String, required: true },
  employeeId: { type: String, required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

TeamManagerSchema.index({ organizationId: 1, email: 1 }, { unique: true });
TeamManagerSchema.index({ organizationId: 1, employeeId: 1 }, { unique: true });

TeamManagerSchema.virtual('id').get(function(this: ITeamManager) {
  return this._id.toHexString();
});

TeamManagerSchema.set('toJSON', { virtuals: true });
TeamManagerSchema.set('toObject', { virtuals: true });

export default mongoose.model<ITeamManager>('TeamManager', TeamManagerSchema);
