const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createRole, getAllRoles, getRoleWithId, updateRoleWithId, deleteRoleWithId } = require("../controller/role.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createRole);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllRoles);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getRoleWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateRoleWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteRoleWithId);

module.exports = router;