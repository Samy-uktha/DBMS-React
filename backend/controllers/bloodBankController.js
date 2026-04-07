const pool = require('../db');

// GET /api/blood-banks/nearby
const getNearby = async (req, res) => {
  try {
    // Get donor_id from the logged-in user
    const donorResult = await pool.query(
      'SELECT id FROM donors WHERE user_id = $1',
      [req.user.id]
    );

    if (donorResult.rows.length === 0)
      return res.status(404).json({ error: 'Donor profile not found' });

    const donorId = donorResult.rows[0].id;

    const result = await pool.query(
      'SELECT * FROM get_nearby_blood_banks($1)',
      [donorId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getNearby };