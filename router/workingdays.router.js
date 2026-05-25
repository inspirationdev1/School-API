const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createWorkingdays, getAllWorkingdays,getWorkingdaysWithQuery, getWorkingdaysWithId, updateWorkingdaysWithId, deleteWorkingdaysWithId } = require("../controller/workingdays.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createWorkingdays);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllWorkingdays);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getWorkingdaysWithQuery);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getWorkingdaysWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateWorkingdaysWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteWorkingdaysWithId);



module.exports = router;