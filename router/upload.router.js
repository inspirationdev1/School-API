const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { upload_accountlevel } = require("../controller/upload.controller");

router.post("/upload_accountlevel",authMiddleware(['SCHOOL','USER']), upload_accountlevel);

module.exports = router;