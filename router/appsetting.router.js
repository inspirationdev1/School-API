const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAppsetting, getAllAppsettings, getAppsettingWithId, updateAppsettingWithId, deleteAppsettingWithId } = require("../controller/appsetting.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createAppsetting);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getAllAppsettings);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getAppsettingWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateAppsettingWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteAppsettingWithId);

module.exports = router;