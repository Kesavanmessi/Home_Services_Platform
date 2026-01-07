const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { LIMITS } = require('./config/constants'); // Import constants

dotenv.config();

const app = express();

// Standard Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Lock down CORS
app.use(express.json({ limit: LIMITS.JSON_BODY_SIZE })); // Limit payload
app.use(express.urlencoded({ extended: true }));

// Security Middleware (Must be AFTER body parser)
app.use(helmet());
// app.use(mongoSanitize()); // Causing TypeError on Node 22
// app.use(xss()); // Deprecated
app.use(hpp());

// Rate Limiting
const limiter = rateLimit({
    windowMs: LIMITS.RATE_LIMIT_WINDOW_MS,
    max: LIMITS.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/provider', require('./routes/provider'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/transactions', require('./routes/transactions'));





app.get('/', (req, res) => {
    res.send('Home Service Platform API Running');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
