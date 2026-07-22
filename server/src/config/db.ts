import mongoose from 'mongoose';
import { env } from './env';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = env.MONGODB_URI || 'mongodb://localhost:27017/traxale-hrm';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully!');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    // Don't exit process anymore so server still runs
  }
};

export default connectDB;