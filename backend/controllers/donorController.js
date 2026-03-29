const pool = require('../db');

const createDonor = async (req, res) => {
  const userId = req.user.id;
  const { blood_group, date_of_birth, weight, last_donation_date } = req.body;
  if (!blood_group || !date_of_birth)
    return res.status(400).json({ error: 'blood_group and date_of_birth required' });
  try {
    const existing = await pool.query('SELECT id FROM donors WHERE user_id=$1', [userId]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'DONOR_EXISTS' });

    const result = await pool.query(
      `INSERT INTO donors (user_id, blood_group, date_of_birth, weight, last_donation_date)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [userId, blood_group, date_of_birth, weight || null, last_donation_date || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id as user_id, u.name, u.email, u.phone, u.address_line,
              u.city, u.state, u.pincode, d.id as donor_id,
              d.blood_group, d.date_of_birth, d.weight, d.last_donation_date
       FROM users u
       JOIN donors d ON d.user_id = u.id
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

const donate = async (req, res) => {
  const userId = req.user.id;
  const { blood_bank_id } = req.body;

  if (!blood_bank_id)
    return res.status(400).json({ error: 'blood_bank_id required' });

  try {
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1', [userId]
    );
    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'Donor not found' });
    const donorId = donorResult.rows[0].id;

    const screenResult = await pool.query(
      `SELECT id FROM donor_screening 
       WHERE donor_id = $1 AND status = 'PASSED' 
       ORDER BY screening_date DESC LIMIT 1`,
      [donorId]
    );
    if (screenResult.rows.length === 0)
      return res.status(400).json({ error: 'No passed screening found. You must pass screening before donating.' });
    const screeningId = screenResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO donations (donor_id, blood_bank_id, screening_id, donation_date, units_collected)
       VALUES ($1, $2, $3, CURRENT_DATE, 3) RETURNING *`,
      [donorId, blood_bank_id, screeningId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createDonor, getMyProfile, donate };
