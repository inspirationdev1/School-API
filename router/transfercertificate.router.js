const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createTransfercertificate, getAllTransfercertificates, getTransfercertificateWithId, updateTransfercertificateWithId
    , deleteTransfercertificateWithId,getTransfercertificatePrint } = require("../controller/transfercertificate.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createTransfercertificate);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllTransfercertificates);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getTransfercertificateWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateTransfercertificateWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteTransfercertificateWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getTransfercertificatePrint);

module.exports = router;