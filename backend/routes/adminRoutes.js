const express = require("express");
const router = express.Router();

const { recordDonation, fulfillRequest } = require("../controllers/adminController");

router.post("/donation", recordDonation);
router.post("/fulfill/:requestId", fulfillRequest);

module.exports = router;