const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/auth");
const controller = require("../controller/openingstock.controller");

const roles = ["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"];

router.post("/create", authMiddleware(roles), controller.createOpeningstock);

router.get("/fetch-all", authMiddleware(roles), controller.getAllOpeningstocks);

router.get(
  "/fetch-single/:id",
  authMiddleware(roles),
  controller.getOpeningstockWithId,
);

router.patch(
  "/update/:id",
  authMiddleware(roles),
  controller.updateOpeningstockWithId,
);

router.delete(
  "/delete/:id",
  authMiddleware(roles),
  controller.deleteOpeningstockWithId,
);

router.get(
  "/fetch-with-query",
  authMiddleware(roles),
  controller.getOpeningstockWithQuery,
);

module.exports = router;
