const express = require("express");
const { getParentWithQuery, loginParent, updateParentWithId, getParentWithId, signOut, isParentLoggedIn, registerParent, deleteParentWithId, getParentOwnDetails, getAllParents } = require("../controller/parent.controller");
const router = express.Router();
const authMiddleware = require("../auth/auth");

router.post('/register', authMiddleware(['SCHOOL','USER']), registerParent);
router.get("/fetch-with-query", authMiddleware(['SCHOOL','USER']), getParentWithQuery);
router.post("/login", loginParent);
router.patch("/update/:id", authMiddleware(['SCHOOL','USER']), updateParentWithId);
router.get("/fetch-own", authMiddleware(['PARENT']), getParentOwnDetails);
router.get("/fetch-all", authMiddleware(['SCHOOL','USER']), getAllParents);

router.get("/fetch-single/:id", authMiddleware(['PARENT', 'SCHOOL']), getParentWithId);
router.delete("/delete/:id", authMiddleware(['SCHOOL']), deleteParentWithId)
// router.get("/sign-out", signOut);
// router.get("/is-login",  isParentLoggedIn)

module.exports = router;