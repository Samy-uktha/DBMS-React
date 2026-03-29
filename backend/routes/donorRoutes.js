const router = require('express').Router();
const auth = require('../middleware/auth');
const { createDonor, getMyProfile, donate } = require('../controllers/donorController');

router.post('/', auth, createDonor);
router.get('/me', auth, getMyProfile);
router.post('/donate', auth, donate);

module.exports = router;