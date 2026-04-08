const express = require("express");
const router = express.Router();

const { getAdminDashboard, getInventory, getBloodBanks, getAllDonations, testBloodUnits, addBloodTest, checkExpiredUnits, approveAllUnits } = require("../controllers/adminController");

router.get("/dashboard", getAdminDashboard);
router.get("/inventory", getInventory);
router.get("/bloodbanks", getBloodBanks);
router.get("/donations", getAllDonations);
router.get("/testing-units", testBloodUnits);
router.post("/check-expiry", checkExpiredUnits);
router.post("/blood-test", addBloodTest);
router.post("/approve-all-units", approveAllUnits);
// router.post("/donation", recordDonation);
// router.post("/fulfill/:requestId", fulfillRequest);

module.exports = router;