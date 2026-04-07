const router = require('express').Router();
const auth   = require('../middleware/auth');
const { getNearby } = require('../controllers/bloodBankController');

router.get('/nearby', auth, getNearby);

module.exports = router;