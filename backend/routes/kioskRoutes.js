const express = require('express');
const { getKioskDescriptors, recordKioskAttendance } = require('../controllers/kioskController');

const router = express.Router();

router.get('/descriptors', getKioskDescriptors);
router.post('/attendance', recordKioskAttendance);

module.exports = router;
