require("dotenv").config();
const mongoose = require("mongoose");

const Transfercertificate = require("../model/transfercertificate.model");

module.exports = {
  // ============================================================
  // GET ALL TRANSFER CERTIFICATES
  // ============================================================
  getAllTransfercertificates: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      const allTransfercertificate = await Transfercertificate.find({
        school: schoolId,
      })
        .populate("class")
        .populate("section")
        .populate("student");

      res.status(200).json({
        success: true,
        message: "Success in fetching all Transfercertificate",
        data: allTransfercertificate,
      });
    } catch (error) {
      console.log("Error in getAllTransfercertificate", error);

      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Transfercertificate. Try later",
      });
    }
  },

  // ============================================================
  // CREATE TRANSFER CERTIFICATE
  // ============================================================
  createTransfercertificate: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      const newTransfercertificate = new Transfercertificate({
        ...req.body,
        school: schoolId,
      });

      const savedData = await newTransfercertificate.save();

      console.log("Data saved", savedData);

      res.status(200).json({
        success: true,
        data: savedData,
        message: "Transfercertificate is Created Successfully.",
      });
    } catch (error) {
      console.log("Error in createTransfercertificate", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // ============================================================
  // GET TRANSFER CERTIFICATE BY ID
  // ============================================================
  getTransfercertificateWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const transfercertificate = await Transfercertificate.findOne({
        _id: id,
        school: schoolId,
      })
        .populate("class")
        .populate("section")
        .populate("student");

      if (!transfercertificate) {
        return res.status(404).json({
          success: false,
          message: "Transfercertificate data not Available",
        });
      }

      res.status(200).json({
        success: true,
        data: transfercertificate,
      });
    } catch (error) {
      console.log("Error in getTransfercertificateWithId", error);

      res.status(500).json({
        success: false,
        message: "Error in getting Transfercertificate Data",
      });
    }
  },

  // ============================================================
  // UPDATE TRANSFER CERTIFICATE BY ID
  // ============================================================
  updateTransfercertificateWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      console.log("Update Transfercertificate ID:", id);
      console.log("Update data:", req.body);

      /*
       * IMPORTANT:
       * Restrict update to the logged-in user's school.
       * This prevents one school's user from updating another
       * school's transfer certificate.
       */
      const updatedTransfercertificate =
        await Transfercertificate.findOneAndUpdate(
          {
            _id: id,
            school: schoolId,
          },
          {
            $set: {
              ...req.body,
            },
          },
          {
            new: true,
            runValidators: true,
          },
        )
          .populate("class")
          .populate("section")
          .populate("student");

      if (!updatedTransfercertificate) {
        return res.status(404).json({
          success: false,
          message: "Transfercertificate not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transfercertificate Updated",
        data: updatedTransfercertificate,
      });
    } catch (error) {
      console.log("Error in updateTransfercertificateWithId", error);

      res.status(500).json({
        success: false,
        message: "Server Error in Update Transfercertificate. Try later",
      });
    }
  },

  // ============================================================
  // DELETE TRANSFER CERTIFICATE BY ID
  // ============================================================
  deleteTransfercertificateWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const id = req.params.id;

      const deletedTransfercertificate =
        await Transfercertificate.findOneAndDelete({
          _id: id,
          school: schoolId,
        });

      if (!deletedTransfercertificate) {
        return res.status(404).json({
          success: false,
          message: "Transfercertificate not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Transfercertificate Deleted.",
        data: deletedTransfercertificate,
      });
    } catch (error) {
      console.log("Error in deleteTransfercertificateWithId", error);

      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Transfercertificate. Try later",
      });
    }
  },

  // ============================================================
  // GET TRANSFER CERTIFICATE FOR PRINT
  // ============================================================
  getTransfercertificatePrint: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      // Validate ObjectIds before using them in aggregation
      if (
        !mongoose.Types.ObjectId.isValid(id) ||
        !mongoose.Types.ObjectId.isValid(schoolId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid Transfercertificate or School ID",
        });
      }

      const result = await Transfercertificate.aggregate([
        // ======================================================
        // MATCH TRANSFER CERTIFICATE
        // ======================================================
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },

        // ======================================================
        // POPULATE SCHOOL
        // ======================================================
        {
          $lookup: {
            from: "schools",
            localField: "school",
            foreignField: "_id",
            as: "school",
          },
        },

        {
          $unwind: {
            path: "$school",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ======================================================
        // POPULATE CLASS
        // ======================================================
        {
          $lookup: {
            from: "classes",
            localField: "class",
            foreignField: "_id",
            as: "class",
          },
        },

        {
          $unwind: {
            path: "$class",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ======================================================
        // POPULATE SECTION
        // ======================================================
        {
          $lookup: {
            from: "sections",
            localField: "section",
            foreignField: "_id",
            as: "section",
          },
        },

        {
          $unwind: {
            path: "$section",
            preserveNullAndEmptyArrays: true,
          },
        },

        // ======================================================
        // POPULATE STUDENT
        // ======================================================
        {
          $lookup: {
            from: "students",
            localField: "student",
            foreignField: "_id",
            as: "student",
          },
        },

        {
          $unwind: {
            path: "$student",
            preserveNullAndEmptyArrays: true,
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Transfercertificate not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0],
      });
    } catch (error) {
      console.error("Error in getTransfercertificatePrint", error);

      res.status(500).json({
        success: false,
        message: "Error fetching getTransfercertificatePrint",
      });
    }
  },
};
