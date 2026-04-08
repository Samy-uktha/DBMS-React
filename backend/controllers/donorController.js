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

// const donate = async (req, res) => {
//   console.log('Donate request body:', req.body);
//   const userId = req.user.id;
//   const { blood_bank_id, units_collected } = req.body;
//   if (!blood_bank_id)
//     return res.status(400).json({ error: 'blood_bank_id required' });
//   const units = units_collected !== undefined ? parseInt(units_collected) : 3;
//   if (isNaN(units) || units < 1 || units > 5)
//     return res.status(400).json({ error: 'units_collected must be between 1 and 5' });

//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // 1. Get donor
//     const donorResult = await client.query(
//       'SELECT id FROM donors WHERE user_id = $1', [userId]
//     );
//     if (donorResult.rows.length === 0) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ error: 'Donor not found' });
//     }
//     const donorId = donorResult.rows[0].id;

//     // 2. Check passed screening
//     const screenResult = await client.query(
//       `SELECT id FROM donor_screening
//        WHERE donor_id = $1 AND status = 'PASSED'
//        ORDER BY screening_date DESC LIMIT 1`,
//       [donorId]
//     );
//     if (screenResult.rows.length === 0) {
//       await client.query('ROLLBACK');
//       return res.status(400).json({ error: 'No passed screening found. Complete screening before donating.' });
//     }
//     const screeningId = screenResult.rows[0].id;

//     // 3. Insert donation
//     const donationResult = await client.query(
//       `INSERT INTO donations (donor_id, blood_bank_id, screening_id, donation_date, units_collected)
//        VALUES ($1, $2, $3, CURRENT_DATE, $4) RETURNING *`,
//       [donorId, blood_bank_id, screeningId, units]
//     );
//     const donation = donationResult.rows[0];

//     // 4. Split into blood_units via Postgres function
//     await client.query(
//       'SELECT split_donation_into_units($1)',
//       [donation.id]
//     );

//     await client.query('COMMIT');
//     res.status(201).json(donation);
//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   } finally {
//     client.release();
//   }
// };

const donate = async (req, res) => {
  const userId = req.user.id;
  const { blood_bank_id, units_collected } = req.body;
  const units = units_collected || 3;

  try {
    // We just call the procedure. Postgres handles the transaction.
    const result = await pool.query(
      'CALL public.process_donor_donation($1, $2, $3, NULL)', 
      [userId, blood_bank_id, units]
    );

    res.status(201).json({ 
      message: 'Donation successful', 
      donationId: result.rows[0]?.p_donation_id 
    });

  } catch (err) {
    console.error('DB Procedure Error:', err.message);
    
    // Postgres 'RAISE EXCEPTION' messages show up here in err.message
    if (err.message.includes('No passed screening')) {
        return res.status(400).json({ error: err.message });
    }
    
    res.status(500).json({ error: 'Donation failed: ' + err.message });
  }
};

const getEligibility = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Get donor_id
    const donorRes = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [userId]
    );

    if (donorRes.rows.length === 0) {
      return res.status(404).json({ error: 'Donor not found' });
    }

    const donorId = donorRes.rows[0].id;

    // 🔥 2. Call screening validity function
    const result = await pool.query(
      'SELECT * FROM check_screening_validity($1)',
      [donorId]
    );

    const screeningData = result.rows[0];

    // 🔥 3. Also get screening status (PASSED/FAILED)
    const screeningRes = await pool.query(
      `SELECT status, screening_date,remarks,last_donation_date
       FROM donor_screening
       WHERE donor_id = $1
       ORDER BY screening_date DESC
       LIMIT 1`,
      [donorId]
    );
      // after fetching screeningRes

      if (screeningRes.rows.length === 0) {
        return res.json({
          eligibility_status: 'NO_SCREENING' // or RE_SCREEN_REQUIRED
        });
      }

      const latest = screeningRes.rows[0];

// 🔥 HANDLE "donation too recent" FIRST (keep same string)
if (
  latest.remarks &&
  latest.remarks.toLowerCase().includes('donation too recent')
) {
  return res.json({
    eligibility_status: 'DONATION_TOO_RECENT',
    latest_screening_date: latest.screening_date,
    last_donation_date: latest.last_donation_date
  });
}

// ❌ actual failures
if (latest.status === 'FAILED') {
  return res.json({
    eligibility_status: 'SCREENING_FAILED',
    latest_screening_date: latest.screening_date
  });
}

    // ⚠️ Re-screen required
    if (screeningData.screening_status === 'RE_SCREEN_REQUIRED') {
      return res.json({
        eligibility_status: 'SCREENING_EXPIRED',
        latest_screening_date: screeningData.last_screening_date
      });
    }
    // const recentDonation = await pool.query(
    //   `SELECT d.donation_date, bb.name as blood_bank_name, d.blood_bank_id
    //    FROM donations d
    //    JOIN blood_banks bb ON bb.id = d.blood_bank_id
    //    WHERE d.donor_id = $1
    //    ORDER BY d.donation_date DESC
    //    LIMIT 1`,
    //   [donorId]
    // );

    // if (recentDonation.rows.length > 0) {
    //   const lastDonationDate = new Date(recentDonation.rows[0].donation_date);
    //   const today = new Date();

    //   const diffDays = Math.floor(
    //     (today - lastDonationDate) / (1000 * 60 * 60 * 24)
    //   );

    //   if (diffDays < 90) {
    //     const eligibleAfter = new Date(lastDonationDate);
    //     eligibleAfter.setDate(eligibleAfter.getDate() + 90);

    //     return res.json({
    //       eligibility_status: 'DONATION_TOO_RECENT',
    //       latest_screening_date: screeningData.last_screening_date,
    //       last_donation_date: recentDonation.rows[0].donation_date,
    //       eligible_after: eligibleAfter.toISOString().split('T')[0],
    //       last_donated_bank_id: recentDonation.rows[0].blood_bank_id
    //     });
      // }
    // }
    // ✅ Eligible (screening-wise)
    res.json({
      eligibility_status: 'ELIGIBLE',
      latest_screening_date: screeningData.last_screening_date
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

module.exports = { createDonor, getMyProfile, donate, getEligibility ,getDonationHistory};