import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId?: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'warning', 'success', 'error'], required: true },
  time: { type: String, required: true },
  read: { type: Boolean, default: false },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

NotificationSchema.virtual('id').get(function(this: INotification) {
  return this._id.toHexString();
});

NotificationSchema.set('toJSON', { virtuals: true });
NotificationSchema.set('toObject', { virtuals: true });

export default mongoose.model<INotification>('Notification', NotificationSchema);
