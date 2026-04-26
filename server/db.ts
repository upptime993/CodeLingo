import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI tidak ditemukan di environment variables!');
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('✅ MongoDB terhubung!');
  } catch (err: unknown) {
    console.error('❌ Gagal konek MongoDB:', err);
    throw err;
  }
}
