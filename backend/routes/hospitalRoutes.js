const router = require('express').Router();
const auth = require('../middleware/auth');
const { createHospital, getMyHospital, createBloodRequest, getMyRequests, cancelRequest } = require('../controllers/hospitalController');

router.post('/', auth, createHospital);
router.get('/me', auth, getMyHospital);
router.post("/create", auth, createBloodRequest);
router.get("/myrequests", auth, getMyRequests);
router.post("/cancel", auth, cancelRequest)

module.exports = router;