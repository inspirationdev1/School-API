const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createMarksheet, getAllMarksheets, getMarksheetWithId, updateMarksheetWithId, deleteMarksheetWithId,getMarksheetPrint,getMarksheetWithStudentId } = require("../controller/marksheet.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createMarksheet);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllMarksheets);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getMarksheetWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateMarksheetWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteMarksheetWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getMarksheetPrint);
router.get("/fetch-student-invoice",authMiddleware(['SCHOOL','USER']),  getMarksheetWithStudentId);

module.exports = router;