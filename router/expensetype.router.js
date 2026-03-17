// getExpensetypeWithQuery
const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createExpensetype, getAllExpensetypes, getExpensetypeWithId, updateExpensetypeWithId, deleteExpensetypeWithId,getExpensetypeWithQuery } = require("../controller/expensetype.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createExpensetype);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllExpensetypes);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getExpensetypeWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateExpensetypeWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteExpensetypeWithId);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER']),getExpensetypeWithQuery);


module.exports = router;