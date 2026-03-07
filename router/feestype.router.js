const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createFeestype, getAllFeestypes, getFeestypeWithId, updateFeestypeWithId, deleteFeestypeWithId } = require("../controller/feestype.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createFeestype);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllFeestypes);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getFeestypeWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateFeestypeWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteFeestypeWithId);

module.exports = router;