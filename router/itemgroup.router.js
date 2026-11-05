const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createItemgroup,
  getAllItemgroups,
  getItemgroupWithId,
  updateItemgroupWithId,
  deleteItemgroupWithId,
  getItemgroupWithQuery,
} = require("../controller/itemgroup.controller");

router.post(
  "/create",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  createItemgroup,
);
router.get(
  "/fetch-all",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getAllItemgroups,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getItemgroupWithQuery,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getItemgroupWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  updateItemgroupWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  deleteItemgroupWithId,
);

module.exports = router;
