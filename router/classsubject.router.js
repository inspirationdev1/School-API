const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createClasssubject, getAllClasssubjects,getClasssubjectWithQuery
    , getClasssubjectWithId, updateClasssubjectWithId, deleteClasssubjectWithId,getClasssubjectPrint,getClasssubjectWithStudentId } = require("../controller/classsubject.controller");

router.post("/create",authMiddleware(['SCHOOL','USER','TEACHER']), createClasssubject);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER']),getAllClasssubjects);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getClasssubjectWithQuery);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  getClasssubjectWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER','TEACHER']), updateClasssubjectWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER','TEACHER']), deleteClasssubjectWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  getClasssubjectPrint);
router.get("/fetch-student-invoice",authMiddleware(['SCHOOL','USER','TEACHER']),  getClasssubjectWithStudentId);

module.exports = router;