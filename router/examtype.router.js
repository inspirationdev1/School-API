const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createExamtype, getAllExamtypes, getExamtypeWithId, updateExamtypeWithId, deleteExamtypeWithId } = require("../controller/examtype.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createExamtype);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllExamtypes);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getExamtypeWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateExamtypeWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteExamtypeWithId);

module.exports = router;