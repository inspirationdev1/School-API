const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createFeestructure, getAllFeestructures, getFeestructureWithId, getFeestructureWithQuery, updateFeestructureWithId, deleteFeestructureWithId } = require("../controller/feestructure.controller");

router.post("/create", authMiddleware(['SCHOOL','USER']), createFeestructure);
router.get("/fetch-all", authMiddleware(['SCHOOL','USER']), getAllFeestructures);
router.get("/fetch-single/:id", authMiddleware(['SCHOOL','USER']), getFeestructureWithId);
router.get("/fetch-with-query", authMiddleware(['SCHOOL','USER']), getFeestructureWithQuery);
router.patch("/update/:id", authMiddleware(['SCHOOL','USER']), updateFeestructureWithId);
router.delete("/delete/:id", authMiddleware(['SCHOOL','USER']), deleteFeestructureWithId);

module.exports = router;