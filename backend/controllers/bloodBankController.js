const pool = require('../db');

const getByCity = async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: 'city query param required' });
  try {
    const result = await pool.query(
      'SELECT * FROM blood_banks WHERE LOWER(city) = LOWER($1)', [city]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getByCity };