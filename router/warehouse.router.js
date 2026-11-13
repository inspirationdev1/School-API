const express = require("express");
const router = express.Router();

const authMiddleware = require("../auth/auth");

const {
  createWarehouse,
  getAllWarehouse,
  getWarehouseWithQuery,
  getWarehouseWithId,
  updateWarehouseWithId,
  deleteWarehouseWithId,
} = require("../controller/warehouse.controller");

// =====================================
// WAREHOUSE ROUTES
// =====================================

// CREATE WAREHOUSE
router.post("/create", authMiddleware(["SCHOOL", "USER"]), createWarehouse);

// FETCH ALL WAREHOUSES
router.get("/fetch-all", authMiddleware(["SCHOOL", "USER"]), getAllWarehouse);

// FETCH WAREHOUSES WITH SEARCH / QUERY
router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER"]),
  getWarehouseWithQuery,
);

// FETCH SINGLE WAREHOUSE
router.get(
  "/fetch-single/:id",
  authMiddleware(["SCHOOL", "USER"]),
  getWarehouseWithId,
);

// UPDATE WAREHOUSE
router.patch(
  "/update/:id",
  authMiddleware(["SCHOOL", "USER"]),
  updateWarehouseWithId,
);

// DELETE WAREHOUSE
router.delete(
  "/delete/:id",
  authMiddleware(["SCHOOL", "USER"]),
  deleteWarehouseWithId,
);

module.exports = router;
