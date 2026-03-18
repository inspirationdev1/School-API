const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { getMarksheetPrint,getProgressCardPrint,getIncomeExpensePrint } = require("../controller/schoolreports.controller");


router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getMarksheetPrint);
router.get("/progresscard-print",authMiddleware(['SCHOOL','USER']),  getProgressCardPrint);
router.get("/income-expense-print",authMiddleware(['SCHOOL','USER']),  getIncomeExpensePrint);

// router.get("/fetch-with-query",authMiddleware(['SCHOOL','TEACHER','PARENT','USER']),getStudentWithQuery);
module.exports = router;