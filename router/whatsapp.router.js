const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { send_whatsapp } = require("../controller/whatsapp.controller");
const multer = require("multer");

// store file temporarily
const upload = multer({ dest: "uploads/" });
router.post("/send_whatsapp", upload.single("file"),authMiddleware(['SCHOOL','USER']), send_whatsapp);
module.exports = router;

