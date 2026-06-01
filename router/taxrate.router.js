const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createTaxrate, getAllTaxrates,getTaxrateWithQuery, getTaxrateWithId, updateTaxrateWithId, deleteTaxrateWithId } = require("../controller/taxrate.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createTaxrate);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllTaxrates);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),getTaxrateWithQuery);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getTaxrateWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateTaxrateWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteTaxrateWithId);



module.exports = router;