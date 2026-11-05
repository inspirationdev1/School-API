const express = require("express");
const router = express.Router();
const authMiddleware = require("../auth/auth");
const {
  createGeolocation,
  getAllGeolocations,
  getGeolocationWithId,
  updateGeolocationWithId,
  deleteGeolocationWithId,
  getGeolocationWithQuery,
} = require("../controller/geolocation.controller");

router.post("/create", authMiddleware(["COMPANY", "USER"]), createGeolocation);
router.get(
  "/fetch-all",
  authMiddleware(["COMPANY", "USER"]),
  getAllGeolocations,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["COMPANY", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getGeolocationWithQuery,
);
router.get(
  "/fetch-single/:id",
  authMiddleware(["COMPANY", "USER"]),
  getGeolocationWithId,
);
router.patch(
  "/update/:id",
  authMiddleware(["COMPANY", "USER"]),
  updateGeolocationWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(["COMPANY", "USER"]),
  deleteGeolocationWithId,
);

module.exports = router;
