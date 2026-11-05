const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createPurchaseinvoice,
  getAllPurchaseinvoices,
  getPurchaseinvoiceWithId,
  updatePurchaseinvoiceWithId,
  deletePurchaseinvoiceWithId,
  getPurchaseinvoicePrint,
  getPurchaseinvoiceWithSupplierId,
  getPurchaseinvoiceWithQuery,
} = require("../controller/purchaseinvoice.controller");

router.post(
  "/create",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  createPurchaseinvoice,
);
router.get(
  "/fetch-all",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getAllPurchaseinvoices,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchaseinvoiceWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  updatePurchaseinvoiceWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  deletePurchaseinvoiceWithId,
);
router.get(
  "/fetch-print/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchaseinvoicePrint,
);
router.get(
  "/fetch-supplier-invoice",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchaseinvoiceWithSupplierId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getPurchaseinvoiceWithQuery,
);
//
module.exports = router;
