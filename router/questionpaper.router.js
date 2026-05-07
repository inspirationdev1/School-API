const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newQuestionpaper,  getQuestionpaperByClass, updateQuestionpaperWithId, deleteQuestionpaperById, getQuestionpaperById, getAllQuestionpapers, getQuestionpaperWithQuery} = require("../controller/questionpaper.controller");


router.post("/new", authMiddleware(['SCHOOL','USER','TEACHER']),newQuestionpaper);
router.get("/all", authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']), getAllQuestionpapers);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','STUDENT','TEACHER','PARENT']),getQuestionpaperWithQuery);
router.get("/fetch-class/:classId",authMiddleware(['SCHOOL','STUDENT','TEACHER','PARENT','USER']),  getQuestionpaperByClass);
router.get('/single/:id',authMiddleware(['SCHOOL','USER','TEACHER']), getQuestionpaperById );
router.patch("/update/:id",authMiddleware(['SCHOOL','USER','TEACHER']), updateQuestionpaperWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  deleteQuestionpaperById);

module.exports = router;