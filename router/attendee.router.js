const express = require("express");
const router = express.Router();
const authMiddleware = require('../auth/auth');
const { createAttendee, getAllAttendees, getAttendeeWithId
    , updateAttendeeWithId, deleteAttendeeWithId,getAttendeePrint } = require("../controller/attendee.controller");

router.post("/create",authMiddleware(['SCHOOL','USER']), createAttendee);
router.get("/fetch-all",authMiddleware(['SCHOOL','USER']),getAllAttendees);
router.get("/fetch-single/:id",authMiddleware(['SCHOOL','USER']),  getAttendeeWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateAttendeeWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']), deleteAttendeeWithId);
router.get("/fetch-print/:id",authMiddleware(['SCHOOL','USER']),  getAttendeePrint);
module.exports = router;