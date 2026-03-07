const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createMenu, getAllMenu, getMenuWithId, updateMenuWithId, deleteMenuWithId } = require("../controller/menu.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createMenu);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllMenu);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getMenuWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateMenuWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteMenuWithId);

module.exports = router;