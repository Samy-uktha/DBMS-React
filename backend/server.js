const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
// const donorRoutes = require('./routes/donorRoutes');
// const hospitalRoutes = require('./routes/hospitalRoutes');
// const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
// app.use('/api/donor', donorRoutes);
// app.use('/api/hospital', hospitalRoutes);
// app.use('/api/admin', adminRoutes);

app.get("/", (req, res) => {
  res.send("Blood Donation System API Running");
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});