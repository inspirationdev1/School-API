// routes/notices.js
const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { newNotice, fetchAllAudiance, fetchAudiance, deleteNotice, editNotice } = require("../controller/notice.controller");

router.post("/add", authMiddleware(['SCHOOL','USER']), newNotice);
router.get("/fetch/all",authMiddleware(['SCHOOL','TEACHER','STUDENT','PARENT','USER']), fetchAllAudiance)
router.get("/fetch/:audience",authMiddleware(['SCHOOL','TEACHER','STUDENT','PARENT','USER']),fetchAudiance);
router.put("/:id",authMiddleware(['SCHOOL','USER']),editNotice)
router.delete("/:id",authMiddleware(['SCHOOL','USER']),deleteNotice)
  
module.exports = router;
