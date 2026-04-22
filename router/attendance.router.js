const express = require('express');
const router = express.Router();
const { markAttendance, getAttendance, checkAttendance, printAttendance } = require('../controller/attendance.controller');
const authMiddleware = require('../auth/auth')
// Mark attendance
router.post('/mark', authMiddleware(['TEACHER']), markAttendance);
router.get('/:studentId', authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']), getAttendance);
router.get('/check/:classId', authMiddleware(['TEACHER','USER']), checkAttendance);
router.get('/print/:classId', authMiddleware(['TEACHER','USER']), printAttendance);
module.exports = router;
