const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createItem,
  getAllItems,
  getItemWithId,
  getItemWithQuery,
  updateItemWithId,
  deleteItemWithId,
} = require("../controller/item.controller");

router.post(
  "/create",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  createItem,
);
router.get(
  "/fetch-all",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getAllItems,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getItemWithId,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getItemWithQuery,
);
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  updateItemWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  deleteItemWithId,
);

module.exports = router;
