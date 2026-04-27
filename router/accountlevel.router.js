const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAccountlevel, getAllAccountlevels, getAccountlevelWithId, updateAccountlevelWithId, deleteAccountlevelWithId,getAccountlevelWithQuery } = require("../controller/accountlevel.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createAccountlevel);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllAccountlevels);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getAccountlevelWithQuery);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getAccountlevelWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateAccountlevelWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteAccountlevelWithId);

module.exports = router;