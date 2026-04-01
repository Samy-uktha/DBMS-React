const pool = require('../db');

const createScreening = async (req, res) => {
  const userId = req.user.id;
  const { hemoglobin_level, blood_pressure, weight, last_donation_date, remarks } = req.body;

  if (!hemoglobin_level || !blood_pressure || !weight)
    return res.status(400).json({ error: 'hemoglobin_level, blood_pressure and weight required' });

  try {
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id=$1', [userId]
    );
    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'DONOR_NOT_FOUND' });

    const donorId = donorResult.rows[0].id;

    // ── Pass/Fail logic ──────────────────────────────────────────
    const hb       = parseFloat(hemoglobin_level);
    const wt       = parseFloat(weight);
    const hbOk     = hb >= 12.5;
    const weightOk = wt >= 45;

    // Parse BP — expect "120/80" or "120/80 mmHg"
    let bpOk = true;
    if (blood_pressure) {
      const cleaned = blood_pressure.replace(/\s*mmhg/i, '').trim();
      const parts   = cleaned.split('/');
      if (parts.length === 2) {
        const systolic  = parseInt(parts[0]);
        const diastolic = parseInt(parts[1]);
        // Normal range: systolic 90–140, diastolic 60–90
        if (
          isNaN(systolic)  || isNaN(diastolic) ||
          systolic  < 90   || systolic  > 140  ||
          diastolic < 60   || diastolic > 90
        ) {
          bpOk = false;
        }
      }
    }

    const status = (hbOk && weightOk && bpOk) ? 'PASSED' : 'FAILED';

    // Build a remarks note if any criterion failed
    const failReasons = [];
    if (!hbOk)     failReasons.push(`Low hemoglobin (${hb} g/dL, min 12.5)`);
    if (!weightOk) failReasons.push(`Insufficient weight (${wt} kg, min 45)`);
    if (!bpOk)     failReasons.push(`Abnormal blood pressure (${blood_pressure})`);

    const autoRemarks = failReasons.length > 0
      ? failReasons.join('; ') + (remarks ? `. ${remarks}` : '')
      : remarks || null;

    const result = await pool.query(
      `INSERT INTO donor_screening
         (donor_id, screening_date, hemoglobin_level, blood_pressure, weight,
          last_donation_date, status, remarks)
       VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        donorId,
        hemoglobin_level,
        blood_pressure,
        weight,
        last_donation_date || null,
        status,
        autoRemarks,
      ]
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
      `SELECT id, screening_date, hemoglobin_level, blood_pressure, weight,
              last_donation_date, status, remarks
       FROM donor_screening
       WHERE donor_id = $1
       ORDER BY screening_date DESC`,
      [donorResult.rows[0].id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createScreening, getMyScreening };