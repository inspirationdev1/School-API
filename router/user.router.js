const express = require("express");
const { getUserWithQuery, loginUser, updateUserWithId, getUserWithId, signOut, isUserLoggedIn, registerUser, deleteUserWithId, getUserOwnDetails, getAllUsers } = require("../controller/user.controller");
const router = express.Router();
const authMiddleware = require("../auth/auth");

router.post('/register', authMiddleware(['SCHOOL','USER']), registerUser);
router.get("/fetch-with-query", authMiddleware(['SCHOOL','USER']), getUserWithQuery);
router.post("/login", loginUser);
// router.patch("/update", authMiddleware(['SCHOOL','USER']), updateUserWithId);
router.patch("/update/:id",authMiddleware(['SCHOOL','USER']), updateUserWithId);
router.get("/fetch-own", authMiddleware(['SCHOOL','USER']), getUserOwnDetails);
router.get("/fetch-all", authMiddleware(['SCHOOL','USER']), getAllUsers);

router.get("/fetch-single/:id", authMiddleware(['SCHOOL','USER']), getUserWithId);
router.delete("/delete/:id", authMiddleware(['SCHOOL','USER']), deleteUserWithId)
// router.get("/sign-out", signOut);
// router.get("/is-login",  isUserLoggedIn)

module.exports = router;