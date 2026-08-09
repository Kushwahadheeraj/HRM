import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  name: string;
  email: string;
  role: string;
  department: string;
  avatar: string;
  status: 'active' | 'on-leave' | 'remote' | 'offline';
  joinDate: string;
  phone: string;
  employeeId: string;
  salary: number;
  performance: number;
  manager?: string;
  organizationId: mongoose.Types.ObjectId;
  employmentType?: string;
  officeLocation?: string;
  shift?: string;
  workingHours?: string;
  reportingManager?: string;
}

const EmployeeSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  avatar: { type: String, default: '' },
  status: { type: String, enum: ['active', 'on-leave', 'remote', 'offline'], default: 'active' },
  joinDate: { type: String, required: true },
  phone: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  salary: { type: Number, required: true },
  performance: { type: Number, required: true, min: 0, max: 100 },
  manager: { type: String },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  employmentType: { type: String, default: 'Full-Time' },
  officeLocation: { type: String, default: '' },
  shift: { type: String, default: 'General' },
  workingHours: { type: String, default: '9:00 AM - 6:00 PM' },
  reportingManager: { type: String, default: '' },
}, { timestamps: true });

EmployeeSchema.virtual('id').get(function(this: IEmployee) {
  return this._id.toHexString();
});

EmployeeSchema.set('toJSON', { virtuals: true });
EmployeeSchema.set('toObject', { virtuals: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
