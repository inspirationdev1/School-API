const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAccountledger, getAllAccountledgers, getAccountledgerWithId, updateAccountledgerWithId, deleteAccountledgerWithId } = require("../controller/accountledger.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createAccountledger);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllAccountledgers);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getAccountledgerWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateAccountledgerWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteAccountledgerWithId);

module.exports = router;