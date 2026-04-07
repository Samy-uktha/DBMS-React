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

module.exports = {
  getAdminDashboard,
  getInventory,
  getBloodBanks,
  getAllDonations,
};
