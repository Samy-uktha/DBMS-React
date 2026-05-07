const pool = require("../db");

const getAdminDashboard = async (req, res) => {
  try {
    const stats = await pool.query(`SELECT * FROM admin_dashboard_stats`);
    const inventory = await pool.query(`SELECT * FROM inventory_grouped`);
    const testing = await pool.query(`SELECT * FROM pending_testing_units`);

    res.json({
      stats: stats.rows[0],
      inventory: inventory.rows,
      testing: testing.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const getInventory = async (req, res) => {
  try {
    const { blood_bank_id } = req.query;
    let result;

    if (!blood_bank_id || blood_bank_id === "ALL") {
      result = await pool.query(`SELECT * FROM admin_inventory`);
    } else {
      result = await pool.query(
        `SELECT * FROM admin_inventory_by_bank WHERE blood_bank_id = $1`,
        [blood_bank_id]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching inventory" });
  }
};

const getBloodBanks = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name FROM blood_banks`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching blood banks" });
  }
};

const getAllDonations = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM donation_details`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching donations" });
  }
};

const testBloodUnits = async (req, res) => {
  try {
    const pending = await pool.query(`SELECT * FROM blood_units
      WHERE status = 'PENDING_TEST'
      ORDER BY collection_date`);
    const tested = await pool.query(`SELECT bu.*, bt.tested_at
      FROM blood_units bu
      LEFT JOIN LATERAL (
        SELECT tested_at
        FROM blood_tests
        WHERE blood_unit_id = bu.id
        ORDER BY tested_at DESC
        LIMIT 1
      ) bt ON true
      WHERE bu.status != 'PENDING_TEST'
      ORDER BY bu.collection_date DESC;`);

    res.json({
      pending: pending.rows,
      tested: tested.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const checkExpiredUnits = async (req, res) => {
  try {
    await pool.query(`SELECT refresh_all_units()`);
    res.json({ message: "Expiry updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const addBloodTest = async (req, res) => {
  const { blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis } = req.body;

  try {
    await pool.query(
      `INSERT INTO blood_tests
       (blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis]
    );

    res.json({ message: "Test recorded successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveAllUnits = async (req, res) => {
  try {
    await pool.query(`
      INSERT INTO blood_tests
      (blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis)
      SELECT id, false, false, false, false, false
      FROM blood_units
      WHERE status = 'PENDING_TEST'
      AND id NOT IN (SELECT blood_unit_id FROM blood_tests)
    `);

    res.json({ message: "All units approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getAllRequests = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM all_requests_view`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching requests" });
  }
};

const getCompletedRequests = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM get_completed_requests()`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching completed requests" });
  }
};

// const getHospitalsList = async (req, res) => {
//   try {
//     const userResult = await pool.query(
//       'SELECT state FROM users WHERE id = $1',
//       [req.user.id]
//     );

//     if (userResult.rows.length === 0)
//       return res.status(404).json({ error: 'User not found' });

//     const userState = userResult.rows[0].state;

//     const result = await pool.query(
//       `SELECT h.id, h.hospital_name, h.license_number, u.city, u.state
//        FROM hospitals h
//        JOIN users u ON u.id = h.user_id
//        WHERE LOWER(u.state) = LOWER($1)
//        ORDER BY h.hospital_name`,
//       [userState]
//     );
  
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error fetching hospitals' });
//   }
// };

const getHospitalsList = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM hospitals_list_view`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching hospitals' });
  }
};

const getHospitalRequests = async (req, res) => {
  const { hospitalId } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM get_hospital_requests($1)`,
      [hospitalId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching hospital requests" });
  }
};

const fulfillRequestManual = async (req, res) => {
  const { request_id, units } = req.body;

  try {
    const result = await pool.query(
      `SELECT fulfill_request($1, $2) AS issued`,
      [request_id, units]
    );

    const issued = result.rows[0].issued;

    if (issued === 0) {
      return res.status(400).json({ error: "No compatible units available for this request." });
    }

    res.json({
      message: `Successfully allocated and issued ${issued} unit(s).`,
      issued,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const autoFulfillRequests = async (req, res) => {
  const { strategy } = req.body;

  if (!["timestamp", "partial"].includes(strategy)) {
    return res.status(400).json({ error: "strategy must be 'timestamp' or 'partial'" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM auto_fulfill_requests($1)`,
      [strategy]
    );

    const { total_issued, requests_completed } = result.rows[0];

    res.json({
      message: `Auto-fulfill complete.`,
      total_issued,
      requests_fulfilled: requests_completed,
    });
  } catch (err) {
    console.error("AUTO-FULFILL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


const getTransferHistory = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM transfer_history_view LIMIT 50`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching transfer history" });
  }
};

module.exports = {
  getAdminDashboard,
  getInventory,
  getBloodBanks,
  getAllDonations,
  testBloodUnits,
  checkExpiredUnits,
  addBloodTest,
  approveAllUnits,
  getAllRequests,
  getHospitalsList,
  getHospitalRequests,
  fulfillRequestManual,
  autoFulfillRequests,
  getCompletedRequests,
  getTransferHistory
};