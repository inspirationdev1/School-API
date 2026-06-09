const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createJournalvoucher, getAllJournalvouchers, getJournalvoucherWithId, updateJournalvoucherWithId, deleteJournalvoucherWithId,getJournalvoucherWithEmployeeId,getJournalvoucherPrint } = require("../controller/journalvoucher.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createJournalvoucher);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllJournalvouchers);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getJournalvoucherWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateJournalvoucherWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteJournalvoucherWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getJournalvoucherPrint);
router.get("/fetch-employee-journalvoucher",authMiddleware(['SCHOOL','USER']),  getJournalvoucherWithEmployeeId);
module.exports = router;