const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  getSupplierListPrint,
  printPurchaseSummarySupplier,
  printPurchaseSummaryItem,
  printPurchaseInvoiceList,
} = require("../controller/purchasereports.controller");

router.get(
  "/supplier-list-print",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getSupplierListPrint,
);

router.get(
  "/purchase-summary-supplier-print",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printPurchaseSummarySupplier,
);

router.get(
  "/purchase-summary-item-print",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printPurchaseSummaryItem,
);
router.get(
  "/purchase-invoice-list-print",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  printPurchaseInvoiceList,
);

module.exports = router;
