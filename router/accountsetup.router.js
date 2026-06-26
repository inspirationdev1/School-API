const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createAccountsetup,
  getAllAccountsetups,
  getAccountsetupWithId,
  updateAccountsetupWithId,
  deleteAccountsetupWithId,
  getAccountsetupWithScreenId,
  getAccountsetupWithQuery,
} = require("../controller/accountsetup.controller");

router.post("/create", authMiddleware(["SCHOOL", "USER"]), createAccountsetup);
router.get(
  "/fetch-all",
  authMiddleware(["SCHOOL", "USER"]),
  getAllAccountsetups,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER"]),
  getAccountsetupWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER"]),
  updateAccountsetupWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER"]),
  deleteAccountsetupWithId,
);
router.get(
  "/fetch-sequence/:id",
  authMiddleware(["SCHOOL", "USER"]),
  getAccountsetupWithScreenId,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getAccountsetupWithQuery,
);
module.exports = router;
