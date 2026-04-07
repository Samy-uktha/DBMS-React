const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]
    );
    if (userResult.rows.length === 0)
      return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const user  = userResult.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'INVALID_PASSWORD' });

    const token = makeToken(user);
    let redirectTo = 'ROLE_SELECT';
    let extra = {};

    if (user.role === 'DONOR') {
      const donorResult = await pool.query(
        'SELECT * FROM donors WHERE user_id = $1', [user.id]
      );
      if (donorResult.rows.length === 0) {
        // No donor profile yet
        redirectTo = 'DONOR_FORM';
      } else {
        extra.donor = donorResult.rows[0];
        // ✅ Always go to dashboard — screening check is handled inside the dashboard
        redirectTo = 'DONOR_DASHBOARD';
      }
    } else if (user.role === 'HOSPITAL') {
      const hospResult = await pool.query(
        'SELECT * FROM hospitals WHERE user_id = $1', [user.id]
      );
      redirectTo = hospResult.rows.length > 0 ? 'HOSPITAL_DASHBOARD' : 'HOSPITAL_FORM';
      if (hospResult.rows.length > 0) extra.hospital = hospResult.rows[0];
    } else if (user.role === 'ADMIN') {
      // 🔥 NEW
      redirectTo = 'ADMIN_DASHBOARD';
    }

    res.json({
      token,
      redirectTo,
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        city:  user.city,
        state: user.state,
      },
      ...extra,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, phone, address_line, city, state, pincode, role } = req.body;
  if (!name || !email || !password || !city || !state || !pincode || !role)
    return res.status(400).json({ error: 'All required fields must be filled' });
  if (!['DONOR', 'HOSPITAL'].includes(role))
    return res.status(400).json({ error: 'Role must be DONOR or HOSPITAL' });

  try {
    const exists = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email.toLowerCase()]
    );
    if (exists.rows.length > 0)
      return res.status(409).json({ error: 'EMAIL_EXISTS' });

    const hash   = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, phone, address_line, city, state, pincode, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, email.toLowerCase(), hash, phone || null, address_line || null, city, state, pincode, role]
    );

    const user  = result.rows[0];
    const token = makeToken(user);

    res.status(201).json({
      token,
      redirectTo: role === 'DONOR' ? 'DONOR_FORM' : 'HOSPITAL_FORM',
      user: {
        id:    user.id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        city:  user.city,
        state: user.state,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { login, register };