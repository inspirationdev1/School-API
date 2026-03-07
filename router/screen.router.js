const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createScreen, getAllScreens, getScreenWithId, updateScreenWithId, deleteScreenWithId } = require("../controller/screen.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createScreen);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllScreens);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getScreenWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateScreenWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteScreenWithId);

module.exports = router;