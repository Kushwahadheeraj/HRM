import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  from: string;
  to: string;
  content: string;
  read: boolean;
  isGroup: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const MessageSchema: Schema = new Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: String, required: true }, // can be userId or roomId
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
  isGroup: { type: Boolean, default: false },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true }
}, { timestamps: true });

MessageSchema.virtual('id').get(function(this: IMessage) {
  return this._id.toHexString();
});

MessageSchema.set('toJSON', { virtuals: true });
MessageSchema.set('toObject', { virtuals: true });

export default mongoose.model<IMessage>('Message', MessageSchema);
// import mongoose from 'mongoose';

// const messageSchema = new mongoose.Schema(
//   {
//     from: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },

//     to: {
//       type: mongoose.Schema.Types.Mixed,
//       required: true,
//     },

//     content: {
//       type: String,
//       required: true,
//     },

//     isGroup: {
//       type: Boolean,
//       default: false,
//     },

//     read: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// export default mongoose.model(
//   'Message',
//   messageSchema
// );