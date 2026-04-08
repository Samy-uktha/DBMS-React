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
      // ✅ OVERALL VIEW
      result = await pool.query(`
        SELECT * FROM admin_inventory
      `);
    } else {
      // ✅ SPECIFIC BANK
      result = await pool.query(
        `
        SELECT * FROM admin_inventory_by_bank
        WHERE blood_bank_id = $1
        `,
        [blood_bank_id],
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
    const pending = await pool.query(`
      SELECT * FROM blood_units
      WHERE status = 'PENDING_TEST'
      ORDER BY collection_date
    `);

    const tested = await pool.query(`
      SELECT bu.*, bt.tested_at
FROM blood_units bu
LEFT JOIN LATERAL (
  SELECT tested_at
  FROM blood_tests
  WHERE blood_unit_id = bu.id
  ORDER BY tested_at DESC
  LIMIT 1
) bt ON true
WHERE bu.status != 'PENDING_TEST'
ORDER BY bu.collection_date DESC;
    `);

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
  const { blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis } =
    req.body;

  try {
    await pool.query(
      `
      INSERT INTO blood_tests
      (blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [blood_unit_id, hiv, hepatitis_b, hepatitis_c, malaria, syphilis],
    );

    // Trigger will update status automatically

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
      AND id NOT IN (
  SELECT blood_unit_id FROM blood_tests
);
    `);

    res.json({ message: "All units approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
};
