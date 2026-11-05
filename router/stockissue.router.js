const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/auth");

const {
  createStockissue,
  getAllStockissues,
  getStockissueWithId,
  getStockissueWithQuery,
  updateStockissueWithId,
  deleteStockissueWithId,
  getStockAvailability,
} = require("../controller/stockissue.controller");

router.post("/create", authMiddleware(["SCHOOL", "USER"]), createStockissue);

router.get("/fetch-all", authMiddleware(["SCHOOL", "USER"]), getAllStockissues);

router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER"]),
  getStockissueWithQuery,
);

router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER"]),
  getStockissueWithId,
);

router.get(
  "/stock-availability/:itemId",
  authMiddleware(["SCHOOL", "USER"]),
  getStockAvailability,
);

router.put(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER"]),
  updateStockissueWithId,
);

router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER"]),
  deleteStockissueWithId,
);

module.exports = router;
