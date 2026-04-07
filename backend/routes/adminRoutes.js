const express = require("express");
const router = express.Router();

const { getAdminDashboard, getInventory, getBloodBanks, getAllDonations } = require("../controllers/adminController");

router.get("/dashboard", getAdminDashboard);
router.get("/inventory", getInventory);
router.get("/bloodbanks", getBloodBanks);
router.get("/donations", getAllDonations);
// router.post("/donation", recordDonation);
// router.post("/fulfill/:requestId", fulfillRequest);

module.exports = router;