const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createBonafidecertificate, getAllBonafidecertificates, getBonafidecertificateWithId
    , updateBonafidecertificateWithId, deleteBonafidecertificateWithId,getBonafidecertificatePrint } = require("../controller/bonafidecertificate.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createBonafidecertificate);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllBonafidecertificates);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getBonafidecertificateWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateBonafidecertificateWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteBonafidecertificateWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getBonafidecertificatePrint);
module.exports = router;