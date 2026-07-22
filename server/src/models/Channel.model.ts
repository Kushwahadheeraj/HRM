import mongoose, { Schema, Document } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  type: 'team' | 'direct'; // Team group chat or direct message between 2 users
  organizationId: mongoose.Types.ObjectId;
  teamId?: string; // For team channels, the team/manager name
  participants: mongoose.Types.ObjectId[]; // Users in the chat
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
}

const ChannelSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['team', 'direct'], required: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  teamId: { type: String },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ChannelSchema.virtual('id').get(function(this: IChannel) {
  return this._id.toHexString();
});

ChannelSchema.set('toJSON', { virtuals: true });
ChannelSchema.set('toObject', { virtuals: true });

export default mongoose.model<IChannel>('Channel', ChannelSchema);
