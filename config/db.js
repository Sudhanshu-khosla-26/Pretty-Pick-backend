const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://akritika2004:Ka%40271910@cluster0.q2ly8wb.mongodb.net/ecommerceDB?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('Atlas DB Connection Failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
