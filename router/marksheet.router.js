const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createMarksheet, getAllMarksheets, getMarksheetWithId, updateMarksheetWithId, deleteMarksheetWithId,getMarksheetPrint,getMarksheetWithStudentId } = require("../controller/marksheet.controller");

router.post("/create",authMiddleware(['SCHOOL','USER','TEACHER']), createMarksheet);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER']),getAllMarksheets);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  getMarksheetWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER','TEACHER']), updateMarksheetWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER','TEACHER']), deleteMarksheetWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  getMarksheetPrint);
router.get("/fetch-student-invoice",authMiddleware(['SCHOOL','USER','TEACHER']),  getMarksheetWithStudentId);

module.exports = router;