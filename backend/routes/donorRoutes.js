const express = require("express");
const router = express.Router();
const { getMyDonations } = require("../controllers/donorController");
const protect = require("../middleware/authMiddleware");

router.get("/my-donations", protect, getMyDonations);

module.exports = router;