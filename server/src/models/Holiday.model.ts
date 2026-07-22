import mongoose, { Schema, Document } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: string; // YYYY-MM-DD format
  type: 'public' | 'company' | 'optional';
  description?: string;
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const HolidaySchema: Schema = new Schema({
  name: { type: String, required: true },
  date: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['public', 'company', 'optional'], 
    required: true,
    default: 'public'
  },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

HolidaySchema.virtual('id').get(function(this: IHoliday) {
  return this._id.toHexString();
});

HolidaySchema.set('toJSON', { virtuals: true });
HolidaySchema.set('toObject', { virtuals: true });

export default mongoose.model<IHoliday>('Holiday', HolidaySchema);
