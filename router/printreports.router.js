const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { printFeeInvoice,printExpense } = require("../controller/printreports.controller");


router.post("/print-feeinvoice", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printFeeInvoice);
router.post("/print-expense", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printExpense) ;


module.exports = router;