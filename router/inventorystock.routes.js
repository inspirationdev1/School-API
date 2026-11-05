const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/auth");

const {
  getInventoryStock,
} = require("../controller/inventorystock.controller");

router.get("/list", authMiddleware(["SCHOOL", "USER"]), getInventoryStock);

module.exports = router;
