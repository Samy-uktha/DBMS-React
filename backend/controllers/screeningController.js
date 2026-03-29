const pool = require('../db');

const createScreening = async (req, res) => {
  const userId = req.user.id;
  const { hemoglobin_level, blood_pressure, weight, remarks } = req.body;
  if (!hemoglobin_level || !blood_pressure || !weight)
    return res.status(400).json({ error: 'hemoglobin_level, blood_pressure and weight required' });
  try {
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id=$1', [userId]
    );
    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'DONOR_NOT_FOUND' });

    const donorId = donorResult.rows[0].id;
    const hb = parseFloat(hemoglobin_level);
    const status = hb >= 12.5 ? 'PASSED' : 'FAILED';

    const result = await pool.query(
      `INSERT INTO donor_screening
         (donor_id, screening_date, hemoglobin_level, blood_pressure, weight, status, remarks)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6) RETURNING *`,
      [donorId, hemoglobin_level, blood_pressure, weight, status, remarks || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyScreening = async (req, res) => {
  try {
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id=$1', [req.user.id]
    );
    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'NOT_FOUND' });

    const result = await pool.query(
      'SELECT * FROM donor_screening WHERE donor_id=$1 ORDER BY screening_date DESC',
      [donorResult.rows[0].id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createScreening, getMyScreening };