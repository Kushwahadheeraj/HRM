import mongoose, { Schema, Document } from 'mongoose';

export interface IRecruitment extends Document {
  jobTitle: string;
  department: string;
  location: string;
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  experience: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  salary: string;
  status: 'open' | 'closed' | 'on-hold';
  applicants: number;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const RecruitmentSchema: Schema = new Schema({
  jobTitle: { type: String, required: true },
  department: { type: String, required: true },
  location: { type: String, required: true },
  jobType: { 
    type: String, 
    enum: ['full-time', 'part-time', 'contract', 'internship'], 
    required: true 
  },
  experience: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [{ type: String, required: true }],
  responsibilities: [{ type: String, required: true }],
  salary: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'on-hold'], default: 'open' },
  applicants: { type: Number, default: 0 },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

RecruitmentSchema.virtual('id').get(function(this: IRecruitment) {
  return this._id.toHexString();
});

RecruitmentSchema.set('toJSON', { virtuals: true });
RecruitmentSchema.set('toObject', { virtuals: true });

export default mongoose.model<IRecruitment>('Recruitment', RecruitmentSchema);
