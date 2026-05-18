const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createGrade, getAllGrades,getGradeWithQuery, getGradeWithId, updateGradeWithId, deleteGradeWithId } = require("../controller/grade.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createGrade);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllGrades);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getGradeWithQuery);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getGradeWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateGradeWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteGradeWithId);

module.exports = router;