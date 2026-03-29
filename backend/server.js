require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const authRoutes       = require('./routes/authRoutes');
const donorRoutes      = require('./routes/donorRoutes');
const hospitalRoutes   = require('./routes/hospitalRoutes');
const screeningRoutes  = require('./routes/screeningRoutes');
const bloodBankRoutes  = require('./routes/bloodBankRoutes');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Health check
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: '🚀 Backend running', time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'DB connection failed' });
  }
});

app.use('/api/auth',        authRoutes);
app.use('/api/donors',      donorRoutes);
app.use('/api/hospitals',   hospitalRoutes);
app.use('/api/screening',   screeningRoutes);
app.use('/api/blood-banks', bloodBankRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on http://localhost:${process.env.PORT || 5000}`)
);