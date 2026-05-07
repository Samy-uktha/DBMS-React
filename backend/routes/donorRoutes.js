const router = require('express').Router();
const auth   = require('../middleware/auth');
const { createDonor, getMyProfile, donate, getEligibility,getDonationHistory, getDonorHospitals } = require('../controllers/donorController');

router.post('/',          auth, createDonor);
router.get('/me',         auth, getMyProfile);
router.post('/donate',    auth, donate);
router.get('/eligibility', auth, getEligibility); 
router.get('/donation-history', auth, getDonationHistory); // ✅ NEW 
router.get('/donorhospitals',auth,getDonorHospitals);

module.exports = router;