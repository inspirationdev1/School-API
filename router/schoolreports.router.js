const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { getMarksheetPrint,getProgressCardPrint,getIncomeExpensePrint,getExpensePrint,getIncomePrint,getAttendancePrint } = require("../controller/schoolreports.controller");


router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getMarksheetPrint);
router.get("/progresscard-print",authMiddleware(['SCHOOL','USER']),  getProgressCardPrint);
router.get("/income-expense-print",authMiddleware(['SCHOOL','USER']),  getIncomeExpensePrint);
router.get("/expense-print",authMiddleware(['SCHOOL','USER']),  getExpensePrint);
router.get("/income-print",authMiddleware(['SCHOOL','USER']),  getIncomePrint);
router.get("/attendance-print",authMiddleware(['SCHOOL','USER']),  getAttendancePrint);


module.exports = router;