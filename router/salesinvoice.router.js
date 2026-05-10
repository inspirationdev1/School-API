const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createSalesinvoice, getAllSalesinvoices, getSalesinvoiceWithId, updateSalesinvoiceWithId
    , deleteSalesinvoiceWithId,getSalesinvoicePrint,getSalesinvoiceWithStudentId
,createMonthlyInvoice,getSalesinvoiceWithQuery } = require("../controller/salesinvoice.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createSalesinvoice);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllSalesinvoices);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getSalesinvoiceWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateSalesinvoiceWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteSalesinvoiceWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getSalesinvoicePrint);
router.get("/fetch-student-invoice",authMiddleware(['SCHOOL','USER']),  getSalesinvoiceWithStudentId);
router.post("/create-multiple-invoice",authMiddleware(['SCHOOL','USER']),  createMonthlyInvoice);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getSalesinvoiceWithQuery);
// 
module.exports = router;