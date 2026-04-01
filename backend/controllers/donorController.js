const pool = require('../db');

const createDonor = async (req, res) => {
  const userId = req.user.id;
  const { blood_group, date_of_birth } = req.body; // weight & last_donation_date removed
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
  console.log('Donate request body:', req.body);
  const userId = req.user.id;
  const { blood_bank_id, units_collected } = req.body;
  if (!blood_bank_id)
    return res.status(400).json({ error: 'blood_bank_id required' });
  const units = units_collected !== undefined ? parseInt(units_collected) : 3;
  if (isNaN(units) || units < 1 || units > 5)
    return res.status(400).json({ error: 'units_collected must be between 1 and 5' });
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
      return res.status(400).json({ error: 'No passed screening found. Complete screening before donating.' });
    const screeningId = screenResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO donations (donor_id, blood_bank_id, screening_id, donation_date, units_collected)
       VALUES ($1, $2, $3, CURRENT_DATE, $4) RETURNING *`,
      [donorId, blood_bank_id, screeningId, units]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getEligibility = async (req, res) => {
  const userId = req.user.id;
  try {
    // Get latest screening for this donor
    const screeningRes = await pool.query(
      `SELECT ds.*
       FROM donor_screening ds
       JOIN donors d ON d.id = ds.donor_id
       WHERE d.user_id = $1
       ORDER BY ds.screening_date DESC
       LIMIT 1`,
      [userId]
    );

    // No screening at all
    if (screeningRes.rows.length === 0) {
      return res.json({ eligibility_status: 'NO_SCREENING' });
    }

    const screening = screeningRes.rows[0];

    // Check if screening is older than 2 months
    const screeningDate = new Date(screening.screening_date);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (screeningDate < twoMonthsAgo) {
      return res.json({
        eligibility_status: 'SCREENING_EXPIRED',
        latest_screening_date: screening.screening_date,
      });
    }

    // Screening failed criteria
    if (screening.status === 'FAILED') {
      return res.json({
        eligibility_status: 'SCREENING_FAILED',
        latest_screening_date: screening.screening_date,
      });
    }

    // Check last donation date (now stored in donor_screening)
    if (screening.last_donation_date) {
      const lastDonation = new Date(screening.last_donation_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (lastDonation > threeMonthsAgo) {
        return res.json({
          eligibility_status: 'DONATION_TOO_RECENT',
          last_donation_date: screening.last_donation_date,
          latest_screening_date: screening.screening_date,
        });
      }
    }

    // Also check donations table — if they donated via the app recently
    const donationRes = await pool.query(
      `SELECT donation_date FROM donations
       WHERE donor_id = (SELECT id FROM donors WHERE user_id = $1)
       ORDER BY donation_date DESC LIMIT 1`,
      [userId]
    );
    if (donationRes.rows.length > 0) {
      const lastAppDonation = new Date(donationRes.rows[0].donation_date);
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      if (lastAppDonation > threeMonthsAgo) {
        return res.json({
          eligibility_status: 'DONATION_TOO_RECENT',
          last_donation_date: donationRes.rows[0].donation_date,
          latest_screening_date: screening.screening_date,
        });
      }
    }

    // All checks passed — eligible
    res.json({
      eligibility_status: 'ELIGIBLE',
      latest_screening_date: screening.screening_date,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createDonor, getMyProfile, donate, getEligibility };