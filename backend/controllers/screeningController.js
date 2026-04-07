const pool = require('../db');


// ✅ Create Screening (NO PASS/FAIL LOGIC HERE)
const createScreening = async (req, res) => {
  const userId = req.user.id;
  // const { hemoglobin_level, blood_pressure, weight, last_donation_date } = req.body;
  // //Basic check
  // if (!hemoglobin_level || !blood_pressure || !weight)
  //   return res.status(400).json({ error: 'hemoglobin_level, blood_pressure and weight required' });
  //  // 🔴 HEMOGLOBIN VALIDATION
  // if (hemoglobin_level < 5 || hemoglobin_level > 25) {
  //   return res.status(400).json({
  //     error: 'Hemoglobin must be between 5 and 25 g/dL'
  //   });
  // }

  // // 🔴 BP FORMAT VALIDATION (must be "120/80")
  // const bpRegex = /^\d{2,3}\/\d{2,3}$/;

  // if (!bpRegex.test(blood_pressure)) {
  //   return res.status(400).json({
  //     error: 'Blood pressure must be in format systolic/diastolic (e.g., 120/80)'
  //   });
  // }

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
         (donor_id, screening_date, hemoglobin_level, blood_pressure, weight, last_donation_date)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
       RETURNING *`,
      [
        donorId,
        hemoglobin_level,
        blood_pressure,
        weight,
        last_donation_date || null
      ]
    );

    // 🔥 IMPORTANT:
    // auto_screen_donor is automatically called via TRIGGER
    // So status + remarks will be updated in DB

    res.status(201).json({
      message: 'Screening submitted successfully',
      data: result.rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
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
    res.status(500).json({ error: 'Server error' });
  }
};


module.exports = { createScreening, getMyScreening };