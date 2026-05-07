const pool = require('../db');

const createDonor = async (req, res) => {
  const userId = req.user.id;
  const { blood_group, date_of_birth } = req.body;
  if (!blood_group || !date_of_birth)
    return res.status(400).json({ error: 'blood_group and date_of_birth required' });
  try {
    const existing = await pool.query('SELECT id FROM donors WHERE user_id=$1', [userId]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'DONOR_EXISTS' });
    const result = await pool.query(
      `INSERT INTO donors (user_id, blood_group, date_of_birth)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, blood_group, date_of_birth]
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
              d.blood_group, d.date_of_birth
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
  const { blood_bank_id, units_collected } = req.body;

  if (!blood_bank_id)
    return res.status(400).json({ error: 'blood_bank_id required' });

  const units = units_collected !== undefined ? parseInt(units_collected) : 3;
  if (isNaN(units) || units < 1 || units > 8)
    return res.status(400).json({ error: 'units_collected must be between 1 and 8' });

  try {
    const result = await pool.query(
      'SELECT * FROM process_donation($1, $2, $3)',
      [userId, blood_bank_id, units]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.message.startsWith('DONOR_NOT_FOUND'))
      return res.status(404).json({ error: 'Donor not found' });
    if (err.message.startsWith('NO_PASSED_SCREENING'))
      return res.status(400).json({ error: 'No passed screening found. Complete screening before donating.' });
    if (err.message.startsWith('INVALID_UNITS'))
      return res.status(400).json({ error: err.message });

    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getEligibility = async (req, res) => {
  const userId = req.user.id;
  try {
    const donorRes = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1', [userId]
    );
    if (donorRes.rows.length === 0)
      return res.status(404).json({ error: 'Donor not found' });

    const donorId = donorRes.rows[0].id;

    const result = await pool.query(
      'SELECT * FROM get_donor_eligibility($1)', [donorId]
    );

    const row = result.rows[0];

    res.json({
      eligibility_status:    row.eligibility_status,
      latest_screening_date: row.latest_screening_date,
      last_donation_date:    row.last_donation_date,
      eligible_after:        row.eligible_after,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getDonationHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const donorRes = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [userId]
    );

    if (donorRes.rows.length === 0)
      return res.status(404).json({ error: 'Donor not found' });

    const donorId = donorRes.rows[0].id;

    const result = await pool.query(
      `SELECT d.id, d.donation_date, d.units_collected,
              bb.name as blood_bank_name,
              bb.city as blood_bank_city,
              bb.id as blood_bank_id
       FROM donations d
       JOIN blood_banks bb ON bb.id = d.blood_bank_id
       WHERE d.donor_id = $1
       ORDER BY d.donation_date DESC`,
      [donorId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// ✅ FIXED: Returns hospitals in the same state as the donor
// so the donor can choose where to go for screening
const getDonorHospitals = async (req, res) => {
  try {
    // Step 1: get the donor's state from the users table
    const userResult = await pool.query(
      'SELECT state FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0)
      return res.status(404).json({ error: 'User not found' });

    const userState = userResult.rows[0].state;

    if (!userState || userState.trim() === '') {
      return res.status(400).json({ error: 'Your profile does not have a state set. Please update your profile.' });
    }

    console.log('Donor user id:', req.user.id, '| state:', JSON.stringify(userState));

    // Step 2: find all hospitals whose linked user account has a matching state
    // Uses ILIKE for case-insensitive matching and trims whitespace on both sides
    const result = await pool.query(
  `SELECT *
   FROM hospitals_list_view
   WHERE TRIM(LOWER(state)) = TRIM(LOWER($1))
   ORDER BY hospital_name ASC`,
  [userState]

    );

    console.log('Hospitals matched:', result.rows.length);

    // Step 3: if nothing found, return empty list with a helpful message header
    if (result.rows.length === 0) {
      return res.json([]);   // frontend will show "no hospitals in your state"
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching hospitals' });
  }
};

module.exports = {
  createDonor,
  getMyProfile,
  donate,
  getEligibility,
  getDonationHistory,
  getDonorHospitals,
};