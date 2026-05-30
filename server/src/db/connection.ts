import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('MONGODB_URI not set - running without database');
    return;
  }
  try {
    await mongoose.connect(uri, { tls: true, tlsAllowInvalidCertificates: true });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Don't throw - allow server to start without DB
  }
};
