import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformance extends Document {
  employeeId: string;
  employeeName: string;
  managerName: string;
  month: string;
  year: number;
  teamwork: number; // 0-100
  innovation: number; // 0-100
  communication: number; // 0-100
  overallScore: number;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const PerformanceSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  managerName: { type: String, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  teamwork: { type: Number, required: true, min: 0, max: 100 },
  innovation: { type: Number, required: true, min: 0, max: 100 },
  communication: { type: Number, required: true, min: 0, max: 100 },
  overallScore: { type: Number, required: true, min: 0, max: 100 },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

PerformanceSchema.virtual('id').get(function(this: IPerformance) {
  return this._id.toHexString();
});

PerformanceSchema.set('toJSON', { virtuals: true });
PerformanceSchema.set('toObject', { virtuals: true });

export default mongoose.model<IPerformance>('Performance', PerformanceSchema);
