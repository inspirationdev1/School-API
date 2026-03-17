const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newExamination,  getExaminationByClass, updateExaminaitonWithId, deleteExaminationById, getExaminationById, getAllExaminations, getExaminationWithQuery} = require("../controller/examination.controller");


router.post("/new", authMiddleware(['SCHOOL','USER']),newExamination);
router.get("/all", authMiddleware(['SCHOOL','TEACHER','USER']), getAllExaminations);
router.get("/fetch-class/:classId",authMiddleware(['SCHOOL','STUDENT','TEACHER','PARENT','USER']),  getExaminationByClass);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER']),getExaminationWithQuery);
router.get('/single/:id',authMiddleware(['SCHOOL','USER']), getExaminationById );
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateExaminaitonWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']),  deleteExaminationById);

module.exports = router;