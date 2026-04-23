const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createCastecertificate, getAllCastecertificates, getCastecertificateWithId
    , updateCastecertificateWithId, deleteCastecertificateWithId,getCastecertificatePrint } = require("../controller/castecertificate.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createCastecertificate);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllCastecertificates);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getCastecertificateWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateCastecertificateWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteCastecertificateWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getCastecertificatePrint);
module.exports = router;