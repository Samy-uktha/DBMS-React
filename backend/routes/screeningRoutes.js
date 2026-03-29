const router = require('express').Router();
const auth = require('../middleware/auth');
const { createScreening, getMyScreening } = require('../controllers/screeningController');
router.post('/', auth, createScreening);
router.get('/me', auth, getMyScreening);
module.exports = router;