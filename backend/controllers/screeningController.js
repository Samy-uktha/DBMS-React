const pool = require('../db');

const createScreening = async (req, res) => {
  const userId = req.user.id;
  const { hemoglobin_level, blood_pressure, weight, last_donation_date, remarks, hospital_id } = req.body;

  if (!hospital_id) {
    return res.status(400).json({ error: 'Please select a screening hospital.' });
  }

  try {
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [userId]
    );
    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'DONOR_NOT_FOUND' });

    const donorId = donorResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO donor_screening 
         (donor_id, screening_date, hemoglobin_level, blood_pressure, weight,
          last_donation_date, remarks, hospital_id)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [donorId, hemoglobin_level, blood_pressure, weight,
       last_donation_date || null,
       remarks || null,
       hospital_id]
    );

    res.status(201).json({
      message: 'Screening submitted successfully',
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error-createscreening' });
  }
};

const getMyScreening = async (req, res) => {
  try {
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [req.user.id]
    );
    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'NOT_FOUND' });

    const donorId = donorResult.rows[0].id;

    const result = await pool.query(
      `SELECT ds.id, ds.screening_date, ds.hemoglobin_level, ds.blood_pressure,
              ds.weight, ds.last_donation_date, ds.status, ds.remarks,
              h.hospital_name, u.city AS hospital_city
       FROM donor_screening ds
       LEFT JOIN hospitals h ON h.id = ds.hospital_id
       LEFT JOIN users u ON u.id = h.user_id
       WHERE ds.donor_id = $1
       ORDER BY ds.screening_date DESC`,
      [donorId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error-getmyscreening' });
  }
};

module.exports = { createScreening, getMyScreening };