const express = require('express');
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createPeriod, getTeacherPeriods, getPeriods, getClassPeriods, updatePeriod, deletePeriod, getPeriodsWithId,getPeriodWithQuery } = require('../controller/period.controller');

router.post('/create',authMiddleware(['SCHOOL','USER']), createPeriod);
router.get('/all',authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']), getPeriods)
router.get('/teacher/:teacherId',authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']), getTeacherPeriods);
router.get('/class/:classId',authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']), getClassPeriods);
router.get('/:id',authMiddleware(['SCHOOL','USER']), getPeriodsWithId)
router.get('/single/:id',authMiddleware(['SCHOOL','USER']), getPeriodsWithId );
// router.put('/update/:id',authMiddleware(['SCHOOL','USER']),  updatePeriod);
router.patch('/update/:id',authMiddleware(['SCHOOL','USER']), updatePeriod);
router.delete('/delete/:id',authMiddleware(['SCHOOL','USER']), deletePeriod);



module.exports = router;
