import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  avatar: string;
  employeeId: string;
  phone?: string;
  shiftId?: string;
  manager?: string;
  organizationId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  mustChangePassword?: boolean;
  temporaryPasswordSet?: boolean;
  theme?: string;
  accentColor?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    leaveRequests: boolean;
    attendanceAlerts: boolean;
    aiInsights: boolean;
  };
  integrations?: {
    slack: boolean;
    googleWorkspace: boolean;
    microsoftTeams: boolean;
    zoom: boolean;
    stripe: boolean;
  };
  plan?: string;
  storageUsed?: number;
  storageTotal?: number;
  lastLogin?: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['hr_manager', 'team_manager', 'employee', 'super_admin'], required: true },
  roleLabel: { type: String, default: 'Employee' },
  department: { type: String, default: 'General' },
  avatar: { type: String, default: '' },
  employeeId: { type: String, unique: true, required: true },
  phone: { type: String },
  shiftId: { type: Schema.Types.ObjectId, ref: 'Shift' },
  manager: { type: String },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  mustChangePassword: { type: Boolean, default: false },
  temporaryPasswordSet: { type: Boolean, default: false },
  theme: { type: String, default: 'dark' },
  accentColor: { type: String, default: '#3B82F6' },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    leaveRequests: { type: Boolean, default: true },
    attendanceAlerts: { type: Boolean, default: false },
    aiInsights: { type: Boolean, default: true }
  },
  integrations: {
    slack: { type: Boolean, default: true },
    googleWorkspace: { type: Boolean, default: true },
    microsoftTeams: { type: Boolean, default: false },
    zoom: { type: Boolean, default: true },
    stripe: { type: Boolean, default: true }
  },
  plan: { type: String, default: 'Professional' },
  storageUsed: { type: Number, default: 2.4 },
  storageTotal: { type: Number, default: 10 },
  lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.virtual('id').get(function(this: IUser) {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(_doc, ret) {
    delete ret.password;
    return ret;
  }
});
UserSchema.set('toObject', {
  virtuals: true,
  transform: function(_doc, ret) {
    delete ret.password;
    return ret;
  }
});

export default mongoose.model<IUser>('User', UserSchema);
