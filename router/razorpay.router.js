const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createReceipt,
  getAllReceipts,
  getReceiptWithId,
  updateReceiptWithId,
  deleteReceiptWithId,
  getReceiptPrint,
  razorOrder,
  razorValidate,
  getAppsettingWithId,
} = require("../controller/razorpay.controller");

router.post("/create", createReceipt);
router.get("/fetch-all", getAllReceipts);
router.get("/fetch-single/:id", getReceiptWithId);
router.patch("/update/:id", updateReceiptWithId);
router.delete("/delete/:id", deleteReceiptWithId);
router.get("/fetch-print/:id", getReceiptPrint);
router.post("/razororder", razorOrder);
router.post("/razorvalidate", razorValidate);
router.get("/fetch-single/:id", getAppsettingWithId);

module.exports = router;
