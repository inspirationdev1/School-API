const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { upload_accountlevel,upload_accountledger,upload_teacher,upload_parent,upload_student,upload_class,upload_section } = require("../controller/upload.controller");
const multer = require("multer");

// store file temporarily
const upload = multer({ dest: "uploads/" });
router.post("/upload_accountlevel", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_accountlevel);
router.post("/upload_accountledger", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_accountledger);
router.post("/upload_teacher", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_teacher);
router.post("/upload_parent", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_parent);
router.post("/upload_student", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_student);
router.post("/upload_class", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_class);
router.post("/upload_section", upload.single("file"),authMiddleware(['SCHOOL','USER']), upload_section);
module.exports = router;