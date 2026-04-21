const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createSubject, getAllSubjects, getSubjectWithId, updateSubjectWithId, deleteSubjectWithId } = require("../controller/subject.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createSubject);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getAllSubjects);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getSubjectWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateSubjectWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteSubjectWithId);

module.exports = router;