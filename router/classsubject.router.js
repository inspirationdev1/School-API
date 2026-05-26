const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createClasssubjects, getAllClasssubjects,getClasssubjectsWithQuery
    , getClasssubjectsWithId, updateClasssubjectsWithId, deleteClasssubjectsWithId } = require("../controller/classsubject.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createClasssubjects);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllClasssubjects);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getClasssubjectsWithQuery);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getClasssubjectsWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateClasssubjectsWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteClasssubjectsWithId);



module.exports = router;