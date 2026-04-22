const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in environment variables');
  }

  try {
    try {
      await mongoose.connect(mongoUri);
    } catch (error) {
      const code = error?.cause?.code || error?.code;
      const syscall = error?.cause?.syscall || error?.syscall;
      const isSrvUri = typeof mongoUri === 'string' && mongoUri.startsWith('mongodb+srv://');

      if (isSrvUri && code === 'ECONNREFUSED' && syscall === 'querySrv') {
        const currentServers = dns.getServers();
        console.warn('MongoDB SRV DNS lookup was refused by current DNS servers:', currentServers);
        console.warn('Retrying MongoDB connection with public DNS servers (1.1.1.1, 8.8.8.8)...');

        dns.setServers(['1.1.1.1', '8.8.8.8']);
        await mongoose.connect(mongoUri);
      } else {
        throw error;
      }
    }
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Atlas DB Connection Failed:', error.message);
    if (error?.cause?.code) {
      console.error('MongoDB connection error code:', error.cause.code);
    }
    if (error?.cause?.syscall) {
      console.error('MongoDB connection syscall:', error.cause.syscall);
    }
    throw error;
  }
};

module.exports = connectDB;
