const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { printChartOfAccount,printTrialBalance } = require("../controller/financereports.controller");


router.post("/print-charofaccount", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printChartOfAccount) ;
router.post("/print-trialbalance", authMiddleware(['SCHOOL', 'USER', 'TEACHER', 'STUDENT', 'PARENT']), printTrialBalance) ;


module.exports = router;