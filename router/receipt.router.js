const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createReceipt, getAllReceipts, getReceiptWithId, updateReceiptWithId, deleteReceiptWithId,getReceiptPrint } = require("../controller/receipt.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createReceipt);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllReceipts);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getReceiptWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateReceiptWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteReceiptWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getReceiptPrint);
module.exports = router;