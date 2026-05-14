const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth')
const { createClass, getAllClass,getClassWithQuery, getClassWithId, updateClassWithId, deleteClassWithId
    , createSubTeacher, updateSubTeacher, deleteSubTeacherWithId, getAttendeeTeacher } = require("../controller/class.controller");


router.post("/create",authMiddleware(['SCHOOL','USER']), createClass);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getAllClass);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getClassWithQuery);
router.get("/fetch-single/:id",  getClassWithId);
router.patch("/update/:id", authMiddleware(['SCHOOL','USER']), updateClassWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteClassWithId);
// router.post("/sub-teach/new/:id",createSubTeacher );
// router.post("/sub-teach/update/:classId/:subTeachId",updateSubTeacher );
// router.delete("/sub-teach/delete/:classId/:subTeachId",deleteSubTeacherWithId );
router.get("/attendee",authMiddleware(['TEACHER']), getAttendeeTeacher);

module.exports = router;