const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newQuestionpaper,  getQuestionpaperByClass, updateQuestionpaperWithId, deleteQuestionpaperById, getQuestionpaperById, getAllQuestionpapers, getQuestionpaperWithQuery} = require("../controller/questionpaper.controller");


router.post("/new", authMiddleware(['SCHOOL','USER']),newQuestionpaper);
router.get("/all", authMiddleware(['SCHOOL','TEACHER','USER']), getAllQuestionpapers);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER']),getQuestionpaperWithQuery);
router.get("/fetch-class/:classId",authMiddleware(['SCHOOL','STUDENT','TEACHER','PARENT','USER']),  getQuestionpaperByClass);
router.get('/single/:id',authMiddleware(['SCHOOL','USER']), getQuestionpaperById );
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateQuestionpaperWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']),  deleteQuestionpaperById);

module.exports = router;