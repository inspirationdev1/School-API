const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createSection, getAllSections, getSectionWithId, updateSectionWithId, deleteSectionWithId,getAttendeeTeacher } = require("../controller/section.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createSection);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getAllSections);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getSectionWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateSectionWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteSectionWithId);
router.get("/attendee",authMiddleware(['TEACHER']), getAttendeeTeacher);
module.exports = router;