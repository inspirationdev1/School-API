require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = process.env.JWTSECRET;

const Supplier = require("../model/supplier.model");
const Attendance = require("../model/attendance.model");

const Documentattachment = require("../model/documentattachment.model");

const cloudinary = require("../config/cloudinary");

const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("./numberseq.controller");

module.exports = {
  getSupplierWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;
      console.log(schoolId, "schoolId");
      filterQuery["school"] = schoolId;
      // if (req.query.hasOwnProperty("search")) {
      //   filterQuery["name"] = { $regex: req.query.search, $options: "i" };
      // }
      if (req.query.hasOwnProperty("search")) {
        filterQuery.$or = [
          { name: { $regex: req.query.search, $options: "i" } },
          { supplier_code: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.user?.role === "SUPPLIER") {
        filterQuery["_id"] = req.user.id;
      }

      const filteredSuppliers = await Supplier.find(filterQuery);
      res.status(200).json({ success: true, data: filteredSuppliers });
    } catch (error) {
      console.log("Error in fetching Supplier with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Supplier  with query.",
      });
    }
  },

  registerSupplier: async (req, res) => {
    const form = new formidable.IncomingForm();

    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const existing = await Supplier.find({ email: fields.email[0] });
        if (existing.length > 0)
          return res
            .status(500)
            .json({ success: false, message: "Email Already Exist!" });

        let photoUrl = null;
        if (files.image && files.image[0]) {
          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "suppliers",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          photoUrl = result.secure_url;
        }

        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(fields.password[0], salt);

        //*****Get Numberseq */
        const numberseqData = await getNumberseqWithScreenId({
          screen_id: "supplier",
          schoolId: req.user.schoolId,
        });
        console.log("numberseqData.data", numberseqData);
        let seq = 1;
        let code = "";
        if (numberseqData) {
          seq = numberseqData.seq || 1;
          code = numberseqData.code || "";
        }
        //******** */

        // const newSupplier = new Supplier({
        //   email: fields.email[0],
        //   name: fields.name[0],
        //   phone_no: fields.phone_no[0],
        //   joinDate: fields.joinDate[0],
        //   status: fields.status[0],
        //   supplier_image: photoUrl,
        //   password: hashPassword,
        //   supplier_code: code || "",
        //   registration_no: fields.registration_no[0],

        //   seq: seq || 1,
        //   school: req.user.id,
        // });

        // const newSupplier = new Supplier({
        //   ...fields[0],
        //   supplier_code: code,
        //   supplier_image: photoUrl,
        //   password: hashPassword,
        //   seq: seq || 1,
        //   school: req.user.id,
        // });
        const newSupplier = new Supplier({
          ...Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [key, value[0]]),
          ),
          supplier_code: code,
          supplier_image: photoUrl,
          password: hashPassword,
          seq: seq || 1,
          school: req.user.id,
        });

        const savedData = await newSupplier.save();

        //*****Update numberseq */
        const numberseqAfterUpdate = await updateNumberseqWithScreenId({
          screen_id: "supplier",
          schoolId: req.user.schoolId,
        });
        console.log("numberseqAfterUpdate", numberseqAfterUpdate);
        //************ */

        res.status(200).json({
          success: true,
          data: savedData,
          message: "Supplier is Registered Successfully.",
        });
      } catch (e) {
        console.log("Error in Register:", e);
        res
          .status(500)
          .json({ success: false, message: "Failed Registration." });
      }
    });
  },
  loginSupplier: async (req, res) => {
    Supplier.find({ email: req.body.email }).then((resp) => {
      if (resp.length > 0) {
        const isAuth = bcrypt.compareSync(req.body.password, resp[0].password);
        if (isAuth) {
          const token = jwt.sign(
            {
              id: resp[0]._id,
              schoolId: resp[0].school,
              email: resp[0].email,
              image_url: resp[0].image_url,
              name: resp[0].name,
              role: "SUPPLIER",
            },
            jwtSecret,
          );

          res.header("Authorization", token);

          res.status(200).json({
            success: true,
            message: "Success Login",
            user: {
              id: resp[0]._id,
              email: resp[0].email,
              image_url: resp[0].supplier_image,
              name: resp[0].name,
              role: "SUPPLIER",
            },
          });
        } else {
          res
            .status(401)
            .json({ success: false, message: "Password doesn't match." });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "Email not registerd." });
      }
    });
  },
  getSupplierWithId: async (req, res) => {
    const id = req.params.id;
    const schoolId = req.user.schoolId;
    try {
      const resp = await Supplier.findOne({
        _id: id,
        school: schoolId,
      });
      if (resp) {
        const documentAttachments = await Documentattachment.find({
          supplier_id: id, // ✅ probably should be supplier instead of _id
          school: schoolId,
        })
          .populate("attachmenttype")
          .populate("attachmentstatus")
          .lean();

        res.status(200).json({
          success: true,
          data: resp,
          documentAttachments: documentAttachments,
        });
      } else {
        res.status(500).json({
          success: false,
          message: "Supplier data not Available",
        });
      }
    } catch (e) {
      console.log("Error in getSupplierWithId", e);

      res.status(500).json({
        success: false,
        message: "Error in getting Supplier Data",
      });
    }
  },
  getOwnDetails: async (req, res) => {
    const id = req.user.id;
    const schoolId = req.user.schoolId;
    Supplier.findOne({ _id: id, school: schoolId })
      .populate("supplier_class")
      .populate("section")
      .populate("parent")
      .populate("bloodgroup")
      .populate("nationality")
      .populate("religion")
      .populate("mothertongue")
      .populate("modeoftransport")
      .populate("firstlanguage")
      .then((resp) => {
        if (resp) {
          console.log("data", resp);
          res.status(200).json({ success: true, data: resp });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Supplier data not Available" });
        }
      })
      .catch((e) => {
        console.log("Error in getSupplierWithId", e);
        res
          .status(500)
          .json({ success: false, message: "Error in getting  Supplier Data" });
      });
  },
  updateSupplierWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const { id } = req.params;
        const supplier = await Supplier.findById(id);
        if (!supplier)
          return res
            .status(404)
            .json({ success: false, message: "Supplier not found." });

        // Update text fields
        Object.keys(fields).forEach((field) => {
          supplier[field] = fields[field][0];
        });

        // Handle image upload to Cloudinary
        if (files.image && files.image[0]) {
          // Optional: Delete old image from Cloudinary if needed
          if (supplier.supplier_image && supplier.public_id) {
            await cloudinary.uploader.destroy(supplier.public_id);
          }

          const photo = files.image[0];
          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "suppliers",
            public_id:
              Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
          });
          supplier.supplier_image = result.secure_url;
          supplier.public_id = result.public_id;
        }
        await supplier.save();
        res.status(200).json({
          success: true,
          message: "Supplier updated successfully",
          data: supplier,
        });
      } catch (e) {
        console.log("Error updating supplier:", e);
        res.status(500).json({
          success: false,
          message: "Error updating supplier details.",
        });
      }
    });
  },

  deleteSupplierWithId: async (req, res) => {
    try {
      let id = req.params.id;
      const schoolId = req.user.schoolId;
      await Attendance.deleteMany({ school: schoolId, supplier: id });
      await Supplier.findOneAndDelete({ _id: id, school: schoolId });
      const supplierAfterDelete = await Supplier.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Supplier  deleted",
        data: supplierAfterDelete,
      });
    } catch (error) {
      console.log("Error in updateSupplierWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in deleted Supplier. Try later",
      });
    }
  },
  documentAttachmentWithId: async (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err)
        return res
          .status(400)
          .json({ success: false, message: "Error parsing form data." });

      try {
        const { id } = req.params;
        const schoolId = req.user.id;

        // Create payload object
        const mapRecord = {
          supplier_id: id,
          attachmenttype: fields?.attachmenttype?.[0] || "",
          attachmentstatus: fields?.attachmentstatus?.[0] || "",
          attachment_image: "",
          public_id: "",
          year: fields?.year?.[0] || 0,
          school: schoolId,
        };

        // Handle image upload to Cloudinary
        // Upload image if exists
        if (files?.image?.[0]) {
          const photo = files.image[0];

          const result = await cloudinary.uploader.upload(photo.filepath, {
            folder: "suppliers",
            public_id:
              Date.now() + "_" + photo.originalFilename.replace(/\s+/g, "_"),
          });

          // ✅ Correct assignment
          mapRecord.attachment_image = result.secure_url;
          mapRecord.public_id = result.public_id;
        }

        // If updating existing attachment
        if (fields?._id?.[0]) {
          const existingAttachment = await Documentattachment.findOne({
            _id: fields._id[0],
            school: schoolId,
          });

          if (existingAttachment) {
            // Delete old cloudinary image if new image uploaded
            if (files?.image?.[0] && existingAttachment.public_id) {
              await cloudinary.uploader.destroy(existingAttachment.public_id);
            }

            // Update existing document
            await Documentattachment.findByIdAndUpdate(
              existingAttachment._id,
              mapRecord,
              { new: true },
            );
          }
        } else {
          // Create new document
          const newDocumentAttachment =
            await Documentattachment.create(mapRecord);
        }

        res.status(200).json({
          success: true,
          message: "Supplier Document Attachment successfully",
          data: mapRecord,
        });
      } catch (e) {
        console.log("Error Document Attachment:", e);
        res.status(500).json({
          success: false,
          message: "Error Document Attachment supplier details.",
        });
      }
    });
  },
  deleteDocumentAttachmentWithId: async (req, res) => {
    try {
      let id = req.params.id;
      const schoolId = req.user.schoolId;
      await Documentattachment.findOneAndDelete({
        _id: id,
        school: schoolId,
      });
      const documentAttachmentAfterDelete = await Documentattachment.findOne({
        _id: id,
      });
      res.status(200).json({
        success: true,
        message: "Document attachment  deleted",
        data: documentAttachmentAfterDelete,
      });
    } catch (error) {
      console.log("Error in deleteDocumentAttachmentWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in deleted Document Attachment. Try later",
      });
    }
  },
  signOut: async (req, res) => {
    try {
      res.header("Authorization", "");
      ("Authorization");
      res.status(200).json({
        success: true,
        messsage: "Supplier Signed Out  Successfully.",
      });
    } catch (error) {
      console.log("Error in Sign out", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Signing Out. Try later",
      });
    }
  },
  isSupplierLoggedIn: async (req, res) => {
    try {
      let token = req.header("Authorization");
      if (token) {
        var decoded = jwt.verify(token, jwtSecret);
        console.log(decoded);
        if (decoded) {
          res.status(200).json({
            success: true,
            data: decoded,
            message: "Supplier is a logged in One",
          });
        } else {
          res
            .status(401)
            .json({ success: false, message: "You are not Authorized." });
        }
      } else {
        res
          .status(401)
          .json({ success: false, message: "You are not Authorized." });
      }
    } catch (error) {
      console.log("Error in isSupplierLoggedIn", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Supplier Logged in check. Try later",
      });
    }
  },
};
async function saveDocumentAttachements(files) {}
