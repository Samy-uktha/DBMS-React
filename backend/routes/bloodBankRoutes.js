const router = require('express').Router();
const auth = require('../middleware/auth');
const { getByCity } = require('../controllers/bloodBankController');
router.get('/', auth, getByCity);
module.exports = router;