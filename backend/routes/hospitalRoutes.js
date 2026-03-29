const router = require('express').Router();
const auth = require('../middleware/auth');
const { createHospital, getMyHospital } = require('../controllers/hospitalController');
router.post('/', auth, createHospital);
router.get('/me', auth, getMyHospital);
module.exports = router;