const app = require('./app');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });

    app.get('/', (req, res) => {
      res.send('Backend Health Check ✅');
    });

    app.get('/api/test', (req, res) => {
      res.send('Backend connected ✅');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();