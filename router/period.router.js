const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createPeriod, getTeacherPeriods, getPeriods, getClassPeriods, updatePeriod, deletePeriod, getPeriodsWithId } = require('../controller/period.controller');

router.post('/create',authMiddleware(['SCHOOL','USER']), createPeriod);
router.get('/all',authMiddleware(['SCHOOL','USER']), getPeriods)
router.get('/teacher/:teacherId',authMiddleware(['SCHOOL','TEACHER','USER']), getTeacherPeriods);
router.get('/class/:classId',authMiddleware(['SCHOOL','STUDENT','TEACHER','PARENT','USER']), getClassPeriods);
router.get('/:id',authMiddleware(['SCHOOL','USER']), getPeriodsWithId)
router.put('/update/:id',authMiddleware(['SCHOOL','USER']),  updatePeriod);
router.delete('/delete/:id',authMiddleware(['SCHOOL','USER']), deletePeriod);

module.exports = router;
