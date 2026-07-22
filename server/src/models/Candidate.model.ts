import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone: string;
  role: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  rating: number;
  source: 'LinkedIn' | 'Referral' | 'Website' | 'Job Board' | 'Other';
  applicationDate: Date;
  resume: string;
  notes: string;
  organizationId: mongoose.Types.ObjectId;
}

const CandidateSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'], 
    default: 'Applied' 
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  source: { 
    type: String, 
    enum: ['LinkedIn', 'Referral', 'Website', 'Job Board', 'Other'], 
    required: true 
  },
  applicationDate: { type: Date, default: Date.now },
  resume: { type: String, default: '' },
  notes: { type: String, default: '' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

CandidateSchema.virtual('id').get(function(this: ICandidate) {
  return this._id.toHexString();
});

CandidateSchema.set('toJSON', { virtuals: true });
CandidateSchema.set('toObject', { virtuals: true });

export default mongoose.model<ICandidate>('Candidate', CandidateSchema);
