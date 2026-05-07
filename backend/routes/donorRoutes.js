const router = require('express').Router();
const auth   = require('../middleware/auth');
const {
  createDonor,
  getMyProfile,
  donate,
  getEligibility,
  getDonationHistory,
  getDonorHospitals,
} = require('../controllers/donorController');

router.post('/',                auth, createDonor);
router.get('/me',               auth, getMyProfile);
router.post('/donate',          auth, donate);
router.get('/eligibility',      auth, getEligibility);
router.get('/donation-history', auth, getDonationHistory);
router.get('/donorhospitals',   auth, getDonorHospitals);   // hospitals in donor's state for screening

module.exports = router;