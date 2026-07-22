import mongoose, { Schema, Document } from 'mongoose';

interface IFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface IReaction {
  emoji: string;
  users: mongoose.Types.ObjectId[];
}

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  channelId: mongoose.Types.ObjectId;
  content: string;
  files?: IFile[];
  reactions?: IReaction[];
  replies?: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const ChatMessageSchema: Schema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
  content: { type: String, required: true },
  files: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
  }],
  reactions: [{
    emoji: { type: String, required: true },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  }],
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' }],
  isDeleted: { type: Boolean, default: false },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

ChatMessageSchema.virtual('id').get(function(this: IChatMessage) {
  return this._id.toHexString();
});

ChatMessageSchema.set('toJSON', { virtuals: true });
ChatMessageSchema.set('toObject', { virtuals: true });

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
