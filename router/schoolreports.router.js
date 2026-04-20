const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { getMarksheetPrint,getProgressCardPrint,getIncomeExpensePrint,getExpensePrint,getIncomePrint,getAttendancePrint,getPendingFeesPrint
    ,getPaidFeesPrint,getPendingExpensesPrint,getPaidExpensesPrint,getSchedulePrint
    ,getIncomeExpenseDashboard,getAttendanceDashboard,getExamQuestionpaperPrint } = require("../controller/schoolreports.controller");


router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getMarksheetPrint);

router.get("/progresscard-print",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),  getProgressCardPrint);

router.get("/income-expense-print",authMiddleware(['SCHOOL','USER']),  getIncomeExpensePrint);
router.get("/expense-print",authMiddleware(['SCHOOL','USER']),  getExpensePrint);
router.get("/income-print",authMiddleware(['SCHOOL','USER']),  getIncomePrint);
router.get("/attendance-print",authMiddleware(['SCHOOL','USER']),  getAttendancePrint);
router.get("/pending-fees-print",authMiddleware(['SCHOOL','USER']),  getPendingFeesPrint);
router.get("/paid-fees-print",authMiddleware(['SCHOOL','USER']),  getPaidFeesPrint);
router.get("/pending-expenses-print",authMiddleware(['SCHOOL','USER']),  getPendingExpensesPrint);
router.get("/paid-expenses-print",authMiddleware(['SCHOOL','USER']),  getPaidExpensesPrint);
router.get("/schedule-print",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT']),  getSchedulePrint);
router.get("/income-expense-dashboard",authMiddleware(['SCHOOL','USER']),  getIncomeExpenseDashboard);
router.get("/attendance-dashboard",authMiddleware(['SCHOOL','USER']),  getAttendanceDashboard);

router.get("/questionpaper-print",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),  getExamQuestionpaperPrint);



module.exports = router;