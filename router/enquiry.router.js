const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createEnquiry, getAllEnquirys, getEnquiryWithId, updateEnquiryWithId, deleteEnquiryWithId,getEnquiryPrint,getEnquiryWithStudentId } = require("../controller/enquiry.controller");

router.post("/create",authMiddleware(['SCHOOL','USER','TEACHER']), createEnquiry);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER']),getAllEnquirys);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  getEnquiryWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER','TEACHER']), updateEnquiryWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER','TEACHER']), deleteEnquiryWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER','TEACHER']),  getEnquiryPrint);
router.get("/fetch-student-invoice",authMiddleware(['SCHOOL','USER','TEACHER']),  getEnquiryWithStudentId);

module.exports = router;