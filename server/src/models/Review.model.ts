import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  organizationName: string;
  userName: string;
  userRole: string;
  rating: number; // 1-5
  comment: string;
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReviewSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  organizationName: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

ReviewSchema.virtual('id').get(function(this: IReview) {
  return this._id.toHexString();
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

export default mongoose.model<IReview>('Review', ReviewSchema);
