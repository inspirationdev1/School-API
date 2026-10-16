require("dotenv").config();
const mongoose = require("mongoose");
const Classsubject = require("../model/classsubject.model");
const Classsubjectdetail = require("../model/classsubjectdetail.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
const ReceiptdetailModel = require("../model/receiptdetail.model");
const {
  getNumberseqWithScreenId,
  updateNumberseqWithScreenId,
} = require("../controller/numberseq.controller");

module.exports = {
  getAllClasssubjects: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const allClasssubject = await Classsubject.find({ school: schoolId });
      res.status(200).json({
        success: true,
        message: "Success in fetching all  Classsubject",
        data: allClasssubject,
      });
    } catch (error) {
      console.log("Error in getAllClasssubject", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Getting All Classsubject. Try later",
      });
    }
  },
  getClasssubjectWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;

      filterQuery["school"] = schoolId;

      if (req.user.role?.toString().toLowerCase() === "teacher") {
        filterQuery["teacher"] = req.user.id;
      }

      if (req.query.search) {
        filterQuery.$or = [
          { classsubject_code: { $regex: req.query.search, $options: "i" } },
          { classsubject_name: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const filteredClasssubjects = await Classsubject.find(filterQuery)
        .populate("class")
        .sort({
          _id: -1,
        });
      res.status(200).json({ success: true, data: filteredClasssubjects });
    } catch (error) {
      console.log("Error in fetching Classsubject with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Classsubject  with query.",
      });
    }
  },
  createClasssubject: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;

      //   const numberseqData = await getNumberseqWithScreenId({
      //     screen_id: "classsubject",
      //     schoolId: req.user.schoolId,
      //   });
      //   console.log("numberseqData.data", numberseqData);
      //   let seq = 1;
      //   let code = "";
      //   if (numberseqData) {
      //     seq = numberseqData.seq || 1;
      //     code = numberseqData.code || "";
      //   }
      //******** */

      // 1️⃣ Save classsubject
      const newClasssubject = new Classsubject({
        ...req.body,
        // msCode: code || "",
        // seq: seq || 1,
        school: schoolId,
      });

      const savedData = await newClasssubject.save();

      // 2️⃣ Map classsubject details
      const msDetail = req.body.classsubjectDetails || [];
      const csId = savedData._id || null;
      const classId = req.body.class || null;
      const classSubjectDetails = msDetail.map((item) => ({
        ...item,
        school: schoolId,
        class: classId,
        csId: csId,
      }));

      // 3️⃣ Save classsubject details
      if (classSubjectDetails.length > 0) {
        await Classsubjectdetail.insertMany(classSubjectDetails);
      }

      //*****Update numberseq */
      //   const numberseqAfterUpdate = await updateNumberseqWithScreenId({
      //     screen_id: "classsubject",
      //     schoolId: req.user.schoolId,
      //   });
      //   console.log("numberseqAfterUpdate", numberseqAfterUpdate);
      //************ */

      // 4️⃣ Response
      res.status(200).json({
        success: true,
        data: savedData,
        message: "Classsubject is Created Successfully.",
      });
    } catch (e) {
      console.error("Error creating Classsubject:", e);
      res.status(500).json({
        success: false,
        message: "Failed Creation of Classsubject.",
      });
    }
  },
  getClasssubjectWithId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Classsubject.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },

        // Populate Class
        {
          $lookup: {
            from: "classes",
            localField: "class",
            foreignField: "_id",
            as: "class",
          },
        },
        { $unwind: { path: "$class", preserveNullAndEmptyArrays: true } },

        // Classsubject Details
        {
          $lookup: {
            from: "classsubjectdetails",
            localField: "_id",
            foreignField: "csId",
            as: "classsubjectDetails",
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Classsubject not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains classsubject + classsubjectDetails[]
      });
    } catch (e) {
      console.error("Error in getClasssubjectWithId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Classsubject",
      });
    }
  },
  updateClasssubjectWithId: async (req, res) => {
    // Not providing the  schoolId as classsubject Id will be unique.
    try {
      const schoolId = req.user.schoolId;

      let id = req.params.id;
      console.log(req.body);
      await Classsubject.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
      );

      // 2️⃣ Map classsubject details
      const msDetail = req.body.classsubjectDetails || [];
      const csId = id || null;
      const classId = req.body.class || null;
      const classSubjectDetails = msDetail.map((item) => ({
        ...item,
        school: schoolId,
        class: classId,
        csId: csId,
      }));
      // 3️⃣ Save Classsubject details
      if (classSubjectDetails.length > 0) {
        await Classsubjectdetail.deleteMany({
          csId: csId,
          school: schoolId,
        });

        await Classsubjectdetail.insertMany(classSubjectDetails);
      }
      const ClasssubjectAfterUpdate = await Classsubject.findOne({ _id: id });
      res.status(200).json({
        success: true,
        message: "Classsubject Updated",
        data: ClasssubjectAfterUpdate,
      });
    } catch (error) {
      console.log("Error in updateClasssubjectWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Update Classsubject. Try later",
      });
    }
  },
  deleteClasssubjectWithId: async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      let id = req.params.id;
      const subExamCount = (
        await Exam.find({ classsubject: id, school: schoolId })
      ).length;
      const subPeriodCount = (
        await Period.find({ classsubject: id, school: schoolId })
      ).length;
      if (subExamCount === 0 && subPeriodCount === 0) {
        await Classsubject.findOneAndUpdate(
          { _id: id },
          { $set: { status: "cancel" } },
          { new: true }, // optional: returns updated document
        );
        await Classsubjectdetail.updateMany(
          { csId: id },
          { $set: { status: "cancel" } },
          { new: true }, // optional: returns updated document
        );
        // await Classsubject.findOneAndDelete({ _id: id, school: schoolId });
        const ClasssubjectAfterDelete = await Classsubject.findOne({ _id: id });
        res.status(200).json({
          success: true,
          message: "Classsubject Deleted.",
          data: ClasssubjectAfterDelete,
        });
      } else {
        res
          .status(500)
          .json({ success: false, message: "This class is already in use." });
      }
    } catch (error) {
      console.log("Error in updateClasssubjectWithId", error);
      res.status(500).json({
        success: false,
        message: "Server Error in Deleting Classsubject. Try later",
      });
    }
  },
  getClasssubjectdetailWithQuery: async (req, res) => {
    try {
      const filterQuery = {};
      const schoolId = req.user.schoolId;

      filterQuery["school"] = schoolId;
      if (req.query.class) {
        filterQuery["class"] = req.query.class;
      }

      const filteredClasssubjects = await Classsubjectdetail.find(filterQuery)
        .populate("class")
        .populate("subject")
        .sort({
          _id: -1,
        });
      res.status(200).json({ success: true, data: filteredClasssubjects });
    } catch (error) {
      console.log("Error in fetching Classsubject with query", error);
      res.status(500).json({
        success: false,
        message: "Error  in fetching Classsubject  with query.",
      });
    }
  },
  getClasssubjectPrint: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const result = await Classsubject.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
            school: new mongoose.Types.ObjectId(schoolId),
          },
        },
        // 🔹 Populate school
        {
          $lookup: {
            from: "schools", // collection name
            localField: "school",
            foreignField: "_id",
            as: "school",
          },
        },
        {
          $unwind: "$school", // convert array → object
        },
        // 🔹 Populate class
        {
          $lookup: {
            from: "classes", // collection name
            localField: "class", // field in classsubject
            foreignField: "_id", // field in classes
            as: "class",
          },
        },
        {
          $unwind: {
            path: "$class",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 Populate Section
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
        // 🔹 Populate Teacher
        {
          $lookup: {
            from: "teachers",
            localField: "teacher",
            foreignField: "_id",
            as: "teacher",
          },
        },
        {
          $unwind: {
            path: "$teacher",
            preserveNullAndEmptyArrays: true,
          },
        },
        // 🔹 Populate Subject
        {
          $lookup: {
            from: "subjects",
            localField: "subject",
            foreignField: "_id",
            as: "subject",
          },
        },
        {
          $unwind: {
            path: "$subject",
            preserveNullAndEmptyArrays: true,
          },
        },
        // 🔹 Populate Examination
        {
          $lookup: {
            from: "examinations",
            localField: "examination",
            foreignField: "_id",
            as: "examination",
          },
        },
        {
          $unwind: {
            path: "$examination",
            preserveNullAndEmptyArrays: true,
          },
        },
        // 🔹 Populate Questionpaper
        {
          $lookup: {
            from: "questionpapers",
            localField: "questionpaper",
            foreignField: "_id",
            as: "questionpaper",
          },
        },
        {
          $unwind: {
            path: "$questionpaper",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "classsubjectdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "csId",
            as: "classsubjectDetails",
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "classsubjectDetails.student",
            foreignField: "_id",
            as: "studentData",
          },
        },
        {
          $addFields: {
            classsubjectDetails: {
              $map: {
                input: "$classsubjectDetails",
                as: "detail",
                in: {
                  $mergeObjects: [
                    "$$detail",
                    {
                      student: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$studentData",
                              as: "fs",
                              cond: {
                                $eq: ["$$fs._id", "$$detail.student"],
                              },
                            },
                          },
                          0,
                        ],
                      },
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            studentData: 0, // cleanup
          },
        },
        // 🔹 SUM marks
        {
          $addFields: {
            totalMarks: {
              $sum: "$classsubjectDetails.marks",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Classsubject not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result[0], // contains classsubject + classsubjectDetails[]
      });
    } catch (e) {
      console.error("Error in getClasssubjectPrint", e);
      res.status(500).json({
        success: false,
        message: "Error fetching getClasssubjectPrint",
      });
    }
  },
  getClasssubjectWithStudentId: async (req, res) => {
    try {
      const id = req.params.id;
      const schoolId = req.user.schoolId;

      const filterQuery = {};
      filterQuery["school"] = new mongoose.Types.ObjectId(schoolId);

      if (req.query.hasOwnProperty("student")) {
        const studentId = req.query.student;
        filterQuery["student"] = new mongoose.Types.ObjectId(studentId);
      }
      filterQuery["status"] = "valid";

      var result = await Classsubject.aggregate([
        {
          $match: filterQuery,
        },

        {
          $lookup: {
            from: "classsubjectdetails", // 👈 collection name (IMPORTANT)
            localField: "_id",
            foreignField: "csId",
            as: "classsubjectDetails",
          },
        },
        // 🔹 SUM grossAmount
        {
          $addFields: {
            totalGrossAmount: {
              $sum: "$classsubjectDetails.grossAmount",
            },
            totalDiscountAmount: {
              $sum: "$classsubjectDetails.discountAmount",
            },
            totalNetAmount: {
              $sum: "$classsubjectDetails.netAmount",
            },
          },
        },
      ]);

      if (!result.length) {
        return res.status(404).json({
          success: false,
          message: "Classsubject not found",
        });
      }

      if (result.length > 0) {
        // const receiptDetails = await ReceiptdetailModel.find(filterQuery).lean();
        const receiptDetails = await ReceiptdetailModel.aggregate([
          { $match: filterQuery },
          {
            $group: {
              _id: "$csId",
              msCode: { $first: "$msCode" },
              totalPaidAmount: { $sum: "$paidAmount" },
              receiptDetails: { $push: "$$ROOT" },
            },
          },
        ]);
        if (receiptDetails.length > 0) {
          console.log("receiptDetails:", receiptDetails);
          for (const item of result) {
            console.log("SI ID:", item._id);
            console.log("Classsubject Code:", item.msCode);
            const csId = item._id;
            const filtered = receiptDetails.filter(
              (row) => row._id.toString() === csId.toString(),
            );
            console.log("filtered:", filtered);
            if (filtered.length > 0) {
              item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
            } else {
              item.totalPaidAmount = 0;
            }
            item.balanceAmount = item.totalNetAmount - item.totalPaidAmount;
          }
          result = result.filter((row) => row.balanceAmount > 0);
          console.log("result:", result);
        }
      }

      res.status(200).json({
        success: true,
        data: result, // contains classsubject + classsubjectDetails[]
      });
    } catch (e) {
      console.error("Error in getClasssubjectWithStudentId", e);
      res.status(500).json({
        success: false,
        message: "Error fetching Classsubject",
      });
    }
  },
};
