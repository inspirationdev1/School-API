const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createItemtype,
  getAllItemtypes,
  getItemtypeWithId,
  updateItemtypeWithId,
  deleteItemtypeWithId,
} = require("../controller/itemtype.controller");

router.post(
  "/create",
  authMiddleware(["SCHOOL", "USER", "TEACHER"]),
  createItemtype,
);
router.get(
  "/fetch-all",
  authMiddleware(["SCHOOL", "USER", "TEACHER"]),
  getAllItemtypes,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER"]),
  getItemtypeWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER"]),
  updateItemtypeWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER"]),
  deleteItemtypeWithId,
);

module.exports = router;
