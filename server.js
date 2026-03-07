require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const adminRoutes = require('./routes/adminRoutes');
const { startOrderCleanupJob } = require('./jobs/orderCleanup');
const { startEscrowAlertJob } = require('./jobs/escrowAlerts');

const app = express();

connectDB();

// Configure CORS with a small allowlist and support for preflight requests.
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || "http://localhost:3000, http://localhost:3001, http://localhost:3002, http://localhost:3003, http://localhost:3004, https://your-production-url.vercel.app").split(',').map(s => s.trim());

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (FRONTEND_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
// Ensure OPTIONS preflight requests are handled for all routes
app.options('*', cors(corsOptions));

app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startOrderCleanupJob();
  startEscrowAlertJob();
});
