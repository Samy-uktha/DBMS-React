const router = require('express').Router();
const auth   = require('../middleware/auth');
const { createDonor, getMyProfile, donate, getEligibility } = require('../controllers/donorController');

router.post('/',          auth, createDonor);
router.get('/me',         auth, getMyProfile);
router.post('/donate',    auth, donate);
router.get('/eligibility', auth, getEligibility);  

module.exports = router;