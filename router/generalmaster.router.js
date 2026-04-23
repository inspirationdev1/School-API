const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createGeneralmaster, getAllGeneralmasters, getGeneralmasterWithId, updateGeneralmasterWithId, deleteGeneralmasterWithId } = require("../controller/generalmaster.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createGeneralmaster);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllGeneralmasters);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getGeneralmasterWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateGeneralmasterWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteGeneralmasterWithId);

module.exports = router;