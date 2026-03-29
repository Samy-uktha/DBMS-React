const pool = require('../db');

const createHospital = async (req, res) => {
  const userId = req.user.id;
  const { hospital_name, license_number } = req.body;
  if (!hospital_name)
    return res.status(400).json({ error: 'hospital_name required' });
  try {
    const existing = await pool.query('SELECT id FROM hospitals WHERE user_id=$1', [userId]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'HOSPITAL_EXISTS' });

    const result = await pool.query(
      `INSERT INTO hospitals (user_id, hospital_name, license_number)
       VALUES ($1,$2,$3) RETURNING *`,
      [userId, hospital_name, license_number || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyHospital = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id as user_id, u.name, u.email, u.phone, u.address_line,
              u.city, u.state, u.pincode, h.id as hospital_id,
              h.hospital_name, h.license_number
       FROM users u
       JOIN hospitals h ON h.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'NOT_FOUND' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createHospital, getMyHospital };