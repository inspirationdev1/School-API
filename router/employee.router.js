const express = require("express");
const { getEmployeeWithQuery, loginEmployee,updateEmployeeWithId,getEmployeeWithId,signOut,isEmployeeLoggedIn,  registerEmployee, deleteEmployeeWithId ,getEmployeeOwnDetails} = require("../controller/employee.controller");
const router = express.Router();
const authMiddleware = require("../auth/auth");

router.post('/register',authMiddleware(['SCHOOL','USER']), registerEmployee);
router.get("/fetch-with-query",authMiddleware(['SCHOOL','USER']),getEmployeeWithQuery);
router.post("/login", loginEmployee);
router.patch("/update/:id", authMiddleware(['SCHOOL','USER']), updateEmployeeWithId);
router.get("/fetch-own", authMiddleware(['EMPLOYEE']), getEmployeeOwnDetails);
router.get("/fetch-single/:id", authMiddleware(['EMPLOYEE','SCHOOL','USER']), getEmployeeWithId);
router.delete("/delete/:id",authMiddleware(['SCHOOL','USER']),  deleteEmployeeWithId)
// router.get("/sign-out", signOut);
// router.get("/is-login",  isEmployeeLoggedIn)

module.exports = router;