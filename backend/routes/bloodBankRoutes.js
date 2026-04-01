const router  = require('express').Router();
const auth    = require('../middleware/auth');
const { getByCity, getByState } = require('../controllers/bloodBankController');

router.get('/',      auth, getByCity);
router.get('/state', auth, getByState);

module.exports = router;