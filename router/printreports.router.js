const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { printFeeInvoice,printExpense,printJournalvoucher } = require("../controller/printreports.controller");


router.post("/print-feeinvoice", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printFeeInvoice);
router.post("/print-expense", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printExpense) ;
router.post("/print-journalvoucher", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printJournalvoucher) ;


module.exports = router;