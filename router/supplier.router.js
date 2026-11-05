const express = require("express");
const {
  getSupplierWithQuery,
  loginSupplier,
  updateSupplierWithId,
  getSupplierWithId,
  signOut,
  isSupplierLoggedIn,
  getOwnDetails,
  registerSupplier,
  deleteSupplierWithId,
  documentAttachmentWithId,
  deleteDocumentAttachmentWithId,
} = require("../controller/supplier.controller");
const authMiddleware = require("../auth/auth");
const router = express.Router();

router.post(
  "/register",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  registerSupplier,
);
router.get(
  "/fetch-with-query",
  authMiddleware(["SCHOOL", "USER", "TEACHER", "STUDENT", "PARENT"]),
  getSupplierWithQuery,
);
router.post("/login", loginSupplier);
router.patch(
  "/update/:id",
  authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),
  updateSupplierWithId,
);
router.get("/fetch-own", authMiddleware(["SUPPLIER"]), getOwnDetails);
router.get(
  "/fetch-single/:id",
  authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),
  getSupplierWithId,
);
router.delete(
  "/delete/:id",
  authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),
  deleteSupplierWithId,
);
router.get("/sign-out", signOut);
router.get("/is-login", isSupplierLoggedIn);
router.post(
  "/document-attachment/:id",
  authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),
  documentAttachmentWithId,
);
router.delete(
  "/delete-document-attachment/:id",
  authMiddleware(['SCHOOL','USER','TEACHER','STUDENT','PARENT']),
  deleteDocumentAttachmentWithId,
);

module.exports = router;
