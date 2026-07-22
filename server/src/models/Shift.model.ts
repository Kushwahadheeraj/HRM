import mongoose, { Schema, Document } from 'mongoose';

export interface IShift extends Document {
  name: string;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  lateThreshold: string; // HH:MM format (e.g., "09:15" for 9:15 AM)
  halfDayThreshold: number; // In hours (e.g., 4)
  isActive: boolean;
  department?: string;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ShiftSchema: Schema = new Schema({
  name: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  lateThreshold: { type: String, required: true },
  halfDayThreshold: { type: Number, required: true, default: 4 },
  isActive: { type: Boolean, default: true },
  department: { type: String },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

ShiftSchema.virtual('id').get(function(this: IShift) {
  return this._id.toHexString();
});

ShiftSchema.set('toJSON', { virtuals: true });
ShiftSchema.set('toObject', { virtuals: true });

export default mongoose.model<IShift>('Shift', ShiftSchema);
