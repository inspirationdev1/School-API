const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { getMarksheetPrint, getProgressCardPrint, getIncomeExpensePrint, getExpensePrint, getIncomePrint, getAttendancePrint, getPendingFeesPrint
    , getPaidFeesPrint, getPendingExpensesPrint, getPaidExpensesPrint, getSchedulePrint
    , getIncomeExpenseDashboard, getAttendanceDashboard, getExamQuestionpaperPrint
    , getChartOfAccountPrint,getStudentListPrint,getParentListPrint
    ,getTeacherListPrint,getEmployeeListPrint
 } = require("../controller/schoolreports.controller");


router.get("/fetch-print/:id", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getMarksheetPrint);

router.get("/progresscard-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getProgressCardPrint);

router.get("/income-expense-print", authMiddleware(['SCHOOL', 'USER']), getIncomeExpensePrint);
router.get("/expense-print", authMiddleware(['SCHOOL', 'USER']), getExpensePrint);
router.get("/income-print", authMiddleware(['SCHOOL', 'USER']), getIncomePrint);
router.get("/attendance-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getAttendancePrint);
router.get("/pending-fees-print", authMiddleware(['SCHOOL', 'USER']), getPendingFeesPrint);
router.get("/paid-fees-print", authMiddleware(['SCHOOL', 'USER']), getPaidFeesPrint);
router.get("/pending-expenses-print", authMiddleware(['SCHOOL', 'USER']), getPendingExpensesPrint);
router.get("/paid-expenses-print", authMiddleware(['SCHOOL', 'USER']), getPaidExpensesPrint);
router.get("/schedule-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getSchedulePrint);
router.get("/income-expense-dashboard", authMiddleware(['SCHOOL', 'USER']), getIncomeExpenseDashboard);
router.get("/attendance-dashboard", authMiddleware(['SCHOOL', 'USER']), getAttendanceDashboard);

router.get("/questionpaper-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getExamQuestionpaperPrint);

router.get("/chart-of-account-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getChartOfAccountPrint);

router.post("/student-list-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getStudentListPrint);
router.post("/parent-list-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getParentListPrint);

router.post("/teacher-list-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getTeacherListPrint);
router.post("/employee-list-print", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), getEmployeeListPrint);


module.exports = router;