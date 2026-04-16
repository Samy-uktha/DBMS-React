const pool = require('../db');


// ✅ Create Screening (NO PASS/FAIL LOGIC HERE)
const createScreening = async (req, res) => {
  const userId = req.user.id;
  const { hemoglobin_level, blood_pressure, weight, last_donation_date,hospital_id } = req.body;
  if (!hospital_id) {
    return res.status(400).json({ error: 'Please select a screening hospital.' });
  }
 

  try {
    // 1. Get donor_id
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [userId]
    );

    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'DONOR_NOT_FOUND' });

    const donorId = donorResult.rows[0].id;

    // 2. Insert screening (NO status, NO remarks)
    const result = await pool.query(
      `INSERT INTO donor_screening
         (donor_id, screening_date, hemoglobin_level, blood_pressure, weight, last_donation_date, hospital_id)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5,$6)
       RETURNING *`,
      [
        donorId,
        hemoglobin_level,
        blood_pressure,
        weight,
        last_donation_date || null,
        hospital_id || null
      ]
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


// ✅ Get all screenings for logged-in user
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
      `SELECT id, screening_date, hemoglobin_level, blood_pressure, weight,
              last_donation_date, status, remarks
       FROM donor_screening
       WHERE donor_id = $1
       ORDER BY screening_date DESC`,
      [donorId]
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: 'Server error-getmyscreening' });
  }
};


module.exports = { createScreening, getMyScreening };