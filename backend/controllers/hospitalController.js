const pool = require('../db');

const createHospital = async (req, res) => {
  const userId = req.user.id;
  const { hospital_name, license_number } = req.body;
  if (!hospital_name)
    return res.status(400).json({ error: 'hospital_name required' });
  try {
    const existing = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'HOSPITAL_EXISTS' });

    const result = await pool.query(
      `INSERT INTO hospitals (user_id, hospital_name, license_number)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, hospital_name, license_number || null]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error("CREATE HOSPITAL ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyHospital = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT u.id as user_id, u.name, u.email, u.phone, u.address_line,
              u.city, u.state, u.pincode,
              h.id as hospital_id, h.hospital_name, h.license_number
       FROM users u
       JOIN hospitals h ON h.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'NOT_FOUND' });

    res.json(result.rows[0]);

  } catch (err) {
    console.error("GET HOSPITAL ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
};


const createBloodRequest = async (req, res) => {
  const userId = req.user.id;
  const { blood_group, units_requested } = req.body;

  if (!blood_group || !units_requested)
    return res.status(400).json({ error: 'Missing required fields' });

  if (units_requested < 1 || units_requested > 20)
    return res.status(400).json({ error: 'Units must be between 1 and 20' });

  try {
    // 🔥 Get hospital_id from DB
    const hospitalRes = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    if (hospitalRes.rows.length === 0)
      return res.status(404).json({ error: 'Hospital not found' });

    const hospital_id = hospitalRes.rows[0].id;

    const result = await pool.query(
      `INSERT INTO blood_requests 
       (hospital_id, blood_group, units_requested)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [hospital_id, blood_group, units_requested]
    );

    res.status(201).json({
      message: 'Blood request created successfully',
      data: result.rows[0],
    });

  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    res.status(500).json({ error: 'Server error' });
  }
};


const getMyRequests = async (req, res) => {
  const userId = req.user.id;

  try {
    // 🔥 Get hospital_id from DB
    const hospitalRes = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    if (hospitalRes.rows.length === 0)
      return res.status(404).json({ error: 'Hospital not found' });

    const hospital_id = hospitalRes.rows[0].id;

    const result = await pool.query(
      `SELECT *
       FROM hospital_requests_view
       WHERE hospital_id = $1
       ORDER BY created_at DESC`,
      [hospital_id]
    );

    res.json(result.rows);

  } catch (err) {
    console.error("GET REQUESTS ERROR:", err);
    res.status(500).json({ error: 'Error fetching requests' });
  }
};

const cancelRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { request_id } = req.body;

    if (!request_id) {
      return res.status(400).json({ error: "request_id required" });
    }

    // 🔥 get hospital_id
    const hospitalRes = await pool.query(
      'SELECT id FROM hospitals WHERE user_id = $1',
      [userId]
    );

    const hospital_id = hospitalRes.rows[0]?.id;

    // 🔥 update safely
    const result = await pool.query(
      `UPDATE blood_requests
       SET status = 'CANCELLED'
       WHERE id = $1
       AND hospital_id = $2
       AND status != 'COMPLETED'
       RETURNING *`,
      [request_id, hospital_id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Cannot cancel request" });
    }

    res.json({ message: "Cancelled successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};



module.exports = {createHospital, getMyHospital, createBloodRequest, getMyRequests, cancelRequest};