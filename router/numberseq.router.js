const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createNumberseq, getAllNumberseqs, getNumberseqWithId, updateNumberseqWithId, deleteNumberseqWithId,getNumberseqWithScreenId } = require("../controller/numberseq.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createNumberseq);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllNumberseqs);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getNumberseqWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateNumberseqWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteNumberseqWithId);
router.get("/fetch-sequence/:id",authMiddleware(['SCHOOL','USER']),  getNumberseqWithScreenId);

module.exports = router;