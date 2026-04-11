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

const getHospitalsList = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM hospitals_list_view`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching hospitals" });
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

  if (!request_id || !units || units < 1)
    return res.status(400).json({ error: "request_id and units (≥1) required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const reqRes = await client.query(
      `SELECT * FROM get_request_by_id($1)`,
      [request_id]
    );

    if (reqRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Request not found" });
    }

    const req_data = reqRes.rows[0];

    if (["COMPLETED", "CANCELLED"].includes(req_data.status)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Request is already " + req_data.status.toLowerCase() });
    }

    const remaining = req_data.units_requested - req_data.units_fulfilled;
    const toIssue = Math.min(units, remaining);

    if (toIssue <= 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No units remaining to fulfill" });
    }

    const unitsRes = await client.query(
      `SELECT * FROM get_compatible_units($1, $2)`,
      [req_data.blood_group, toIssue]
    );

    if (unitsRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: `No compatible available units for blood group ${req_data.blood_group}`,
      });
    }

    let issued = 0;
    for (const unit of unitsRes.rows) {
      await client.query(`SELECT issue_blood_unit($1, $2)`, [request_id, unit.id]);
      issued++;
    }

    await client.query("COMMIT");

    res.json({
      message: `Successfully issued ${issued} unit(s) for request #${request_id}`,
      issued,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("FULFILL ERROR:", err);
    res.status(500).json({ error: err.message || "Failed to fulfill request" });
  } finally {
    client.release();
  }
};

const autoFulfillRequests = async (req, res) => {
  const { strategy } = req.body;

  if (!["timestamp", "partial"].includes(strategy))
    return res.status(400).json({ error: "strategy must be 'timestamp' or 'partial'" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const requestsRes = await client.query(
      `SELECT * FROM get_pending_requests($1)`,
      [strategy]
    );

    const requests = requestsRes.rows;
    let totalIssued = 0;
    let requestsFulfilled = 0;

    for (const req_data of requests) {
      const remaining = req_data.units_requested - req_data.units_fulfilled;
      if (remaining <= 0) continue;

      const unitsRes = await client.query(
        `SELECT * FROM get_compatible_units($1, $2)`,
        [req_data.blood_group, remaining]
      );

      for (const unit of unitsRes.rows) {
        await client.query(`SELECT issue_blood_unit($1, $2)`, [req_data.id, unit.id]);
        totalIssued++;
      }

      if (unitsRes.rows.length >= remaining) {
        requestsFulfilled++;
      }
    }

    await client.query("COMMIT");

    res.json({
      message: `Auto-fulfill complete. ${totalIssued} unit(s) issued across ${requestsFulfilled} fully completed request(s).`,
      total_issued: totalIssued,
      requests_fulfilled: requestsFulfilled,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("AUTO-FULFILL ERROR:", err);
    res.status(500).json({ error: err.message || "Auto-fulfill failed" });
  } finally {
    client.release();
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
  getCompletedRequests
};