const pool = require('../db');

// GET /api/blood-banks?city=Palakkad
const getByCity = async (req, res) => {
  const { city } = req.query;
  if (!city) return res.status(400).json({ error: 'city query param required' });
  try {
    const result = await pool.query(
      'SELECT * FROM blood_banks WHERE LOWER(city) = LOWER($1)',
      [city]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/blood-banks/state?state=Kerala&excludeCity=Palakkad
const getByState = async (req, res) => {
  const { state, excludeCity } = req.query;
  if (!state) return res.status(400).json({ error: 'state query param required' });
  try {
    const result = await pool.query(
      `SELECT * FROM blood_banks
       WHERE LOWER(state) = LOWER($1)
         AND LOWER(city) != LOWER($2)
       ORDER BY city`,
      [state, excludeCity || '']
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getByCity, getByState };