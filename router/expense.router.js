const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createExpense, getAllExpenses, getExpenseWithId, updateExpenseWithId, deleteExpenseWithId,getExpensePrint } = require("../controller/expense.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createExpense);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllExpenses);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getExpenseWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateExpenseWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteExpenseWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getExpensePrint);
module.exports = router;