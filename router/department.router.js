const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createDepartment, getAllDepartments, getDepartmentWithId, updateDepartmentWithId, deleteDepartmentWithId } = require("../controller/department.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createDepartment);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllDepartments);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getDepartmentWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateDepartmentWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteDepartmentWithId);

module.exports = router;