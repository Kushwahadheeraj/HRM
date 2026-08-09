import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailLog extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeEmail: string;
  subject: string;
  sentAt: Date;
  status: 'success' | 'failed';
  errorMessage?: string;
  retryCount: number;
  emailType: string;
  organizationId?: mongoose.Types.ObjectId;
}

const EmailLogSchema: Schema = new Schema({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  employeeEmail: { type: String, required: true },
  subject: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['success', 'failed'], required: true },
  errorMessage: { type: String },
  retryCount: { type: Number, default: 0 },
  emailType: { type: String, required: true, default: 'welcome' },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
}, { timestamps: true });

EmailLogSchema.virtual('id').get(function(this: IEmailLog) {
  return this._id.toHexString();
});

EmailLogSchema.set('toJSON', { virtuals: true });
EmailLogSchema.set('toObject', { virtuals: true });

export default mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
