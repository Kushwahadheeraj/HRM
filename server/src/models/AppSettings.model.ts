import mongoose, { Schema, Document } from 'mongoose';

export interface IAppSettings extends Document {
  googleDriveApkFileId: string;
  apkFileName: string;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const AppSettingsSchema: Schema = new Schema({
  googleDriveApkFileId: { type: String, required: true, default: '16PG_iKxfZuEM-L2JW6ihcH0QuQrGmH7e' },
  apkFileName: { type: String, required: true, default: 'traxale-app.apk' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Singleton: there is only ONE app settings document in the collection
AppSettingsSchema.statics.getOrCreate = async function(): Promise<IAppSettings> {
  const doc = await this.findOne();
  if (doc) return doc;
  return this.create({});
};

export default mongoose.model<IAppSettings>('AppSettings', AppSettingsSchema);
