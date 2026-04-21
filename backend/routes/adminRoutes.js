const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth"); // ← add this import
const { getAdminDashboard, getInventory, getBloodBanks, getAllDonations, testBloodUnits, addBloodTest, checkExpiredUnits, approveAllUnits,getAllRequests,getHospitalRequests,getHospitalsList,fulfillRequestManual,autoFulfillRequests,getCompletedRequests } = require("../controllers/adminController");

router.get("/dashboard", getAdminDashboard);
router.get("/inventory", getInventory);
router.get("/bloodbanks", getBloodBanks);
router.get("/donations", getAllDonations);
router.get("/testing-units", testBloodUnits);
router.post("/check-expiry", checkExpiredUnits);
router.post("/blood-test", addBloodTest);
router.post("/approve-all-units", approveAllUnits);
router.get("/requests", getAllRequests);
router.get("/hospitals-list",auth,getHospitalsList);
router.get("/hospital-requests/:hospitalId", getHospitalRequests);
router.post("/fulfill-request", fulfillRequestManual);
router.post("/auto-fulfill", autoFulfillRequests);
router.get("/completed-requests", getCompletedRequests);
// router.post("/donation", recordDonation);
// router.post("/fulfill/:requestId", fulfillRequest);

module.exports = router;