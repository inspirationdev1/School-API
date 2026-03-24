const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createPayment, getAllPayments, getPaymentWithId, updatePaymentWithId, deletePaymentWithId,getPaymentPrint } = require("../controller/payment.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createPayment);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllPayments);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getPaymentWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updatePaymentWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deletePaymentWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getPaymentPrint);
module.exports = router;