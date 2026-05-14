require("dotenv").config();
const mongoose = require("mongoose");
const Marksheet = require("../model/marksheet.model");
const Marksheetdetail = require("../model/marksheetdetail.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
const ReceiptdetailModel = require("../model/receiptdetail.model");
const { getNumberseqWithScreenId, updateNumberseqWithScreenId } = require("../controller/numberseq.controller");

module.exports = {

    getAllMarksheets: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allMarksheet = await Marksheet.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Marksheet", data: allMarksheet })
        } catch (error) {
            console.log("Error in getAllMarksheet", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Marksheet. Try later" })
        }

    },
    createMarksheet: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            const numberseqData = await getNumberseqWithScreenId({ screen_id: "marksheet", schoolId: req.user.schoolId });
            console.log("numberseqData.data", numberseqData);
            let seq = 1;
            let code = "";
            if (numberseqData) {
                seq = numberseqData.seq || 1;
                code = numberseqData.code || "";
            }
            //******** */

            // 1️⃣ Save marksheet
            const newMarksheet = new Marksheet({
                ...req.body,
                msCode: code || "",
                seq: seq || 1,
                school: schoolId,
            });

            const savedData = await newMarksheet.save();

            // 2️⃣ Map marksheet details
            const msDetail = req.body.marksheetDetails || [];
            const msId = savedData._id || null;
            const markSheetDetails = msDetail.map((item) => ({
                ...item,
                school: schoolId,
                msId: msId,
            }));

            // 3️⃣ Save marksheet details
            if (markSheetDetails.length > 0) {
                await Marksheetdetail.insertMany(markSheetDetails);
            }

            //*****Update numberseq */
            const numberseqAfterUpdate = await updateNumberseqWithScreenId({ screen_id: "marksheet", schoolId: req.user.schoolId });
            console.log("numberseqAfterUpdate", numberseqAfterUpdate);
            //************ */

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Marksheet is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating Marksheet:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Marksheet.",
            });
        }
    },
    getMarksheetWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            // const result = await Marksheet.aggregate([
            //     {
            //         $match: {
            //             _id: new mongoose.Types.ObjectId(id),
            //             school: new mongoose.Types.ObjectId(schoolId),
            //         },
            //     },

            //     {
            //         $lookup: {
            //             from: "marksheetdetails", // 👈 collection name (IMPORTANT)
            //             localField: "_id",
            //             foreignField: "msId",
            //             as: "marksheetDetails",
            //         },
            //     },
            // ]);

            const result = await Marksheet.aggregate([
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

                // Populate Section
                {
                    $lookup: {
                        from: "sections",
                        localField: "section",
                        foreignField: "_id",
                        as: "section",
                    },
                },
                { $unwind: { path: "$section", preserveNullAndEmptyArrays: true } },

                // Populate Teacher
                {
                    $lookup: {
                        from: "teachers",
                        localField: "teacher",
                        foreignField: "_id",
                        as: "teacher",
                    },
                },
                { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } },

                // Populate Subject
                {
                    $lookup: {
                        from: "subjects",
                        localField: "subject",
                        foreignField: "_id",
                        as: "subject",
                    },
                },
                { $unwind: { path: "$subject", preserveNullAndEmptyArrays: true } },

                // Populate Examination
                {
                    $lookup: {
                        from: "examinations",
                        localField: "examination",
                        foreignField: "_id",
                        as: "examination",
                    },
                },
                { $unwind: { path: "$examination", preserveNullAndEmptyArrays: true } },

                // Populate Questionpaper
                {
                    $lookup: {
                        from: "questionpapers",
                        localField: "questionpaper",
                        foreignField: "_id",
                        as: "questionpaper",
                    },
                },
                { $unwind: { path: "$questionpaper", preserveNullAndEmptyArrays: true } },

                // Marksheet Details
                {
                    $lookup: {
                        from: "marksheetdetails",
                        localField: "_id",
                        foreignField: "msId",
                        as: "marksheetDetails",
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getMarksheetWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Marksheet",
            });
        }
    }
    ,

    updateMarksheetWithId: async (req, res) => {
        // Not providing the  schoolId as marksheet Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Marksheet.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map marksheet details
            const msDetail = req.body.marksheetDetails || [];
            const msId = id || null;
            const markSheetDetails = msDetail.map((item) => ({
                ...item,
                school: schoolId,
                msId: msId,
            }));
            // 3️⃣ Save Marksheet details
            if (markSheetDetails.length > 0) {
                await Marksheetdetail.deleteMany({
                    msId: msId,
                    school: schoolId
                });

                await Marksheetdetail.insertMany(markSheetDetails);
            }
            const MarksheetAfterUpdate = await Marksheet.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Marksheet Updated", data: MarksheetAfterUpdate })
        } catch (error) {

            console.log("Error in updateMarksheetWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Marksheet. Try later" })
        }

    },
    deleteMarksheetWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            const subExamCount = (await Exam.find({ marksheet: id, school: schoolId })).length;
            const subPeriodCount = (await Period.find({ marksheet: id, school: schoolId })).length;
            if ((subExamCount === 0) && (subPeriodCount === 0)) {
                await Marksheet.findOneAndUpdate(
                    { _id: id },
                    { $set: { status: "cancel" } },
                    { new: true } // optional: returns updated document
                );
                await Marksheetdetail.updateMany(
                    { msId: id },
                    { $set: { status: "cancel" } },
                    { new: true } // optional: returns updated document
                );
                // await Marksheet.findOneAndDelete({ _id: id, school: schoolId });
                const MarksheetAfterDelete = await Marksheet.findOne({ _id: id });
                res.status(200).json({ success: true, message: "Marksheet Deleted.", data: MarksheetAfterDelete })
            } else {
                res.status(500).json({ success: false, message: "This class is already in use." })
            }


        } catch (error) {

            console.log("Error in updateMarksheetWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Marksheet. Try later" })
        }

    },
    getMarksheetPrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Marksheet.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },
                // 🔹 Populate school
                {
                    $lookup: {
                        from: "schools",          // collection name
                        localField: "school",
                        foreignField: "_id",
                        as: "school",
                    },
                },
                {
                    $unwind: "$school",        // convert array → object
                },
                // 🔹 Populate class
                {
                    $lookup: {
                        from: "classes",          // collection name
                        localField: "class",      // field in marksheet
                        foreignField: "_id",      // field in classes
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
                        from: "marksheetdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "msId",
                        as: "marksheetDetails",
                    },
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "marksheetDetails.student",
                        foreignField: "_id",
                        as: "studentData",
                    },
                },
                {
                    $addFields: {
                        marksheetDetails: {
                            $map: {
                                input: "$marksheetDetails",
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
                            $sum: "$marksheetDetails.marks",
                        },

                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getMarksheetPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getMarksheetPrint",
            });
        }
    },
    getMarksheetWithStudentId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const filterQuery = {};
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            if (req.query.hasOwnProperty('student')) {
                const studentId = req.query.student;
                filterQuery['student'] = new mongoose.Types.ObjectId(studentId);
            }
            filterQuery['status'] = "valid";

            var result = await Marksheet.aggregate([
                {
                    $match: filterQuery,
                },

                {
                    $lookup: {
                        from: "marksheetdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "msId",
                        as: "marksheetDetails",
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalGrossAmount: {
                            $sum: "$marksheetDetails.grossAmount",
                        },
                        totalDiscountAmount: {
                            $sum: "$marksheetDetails.discountAmount",
                        },
                        totalNetAmount: {
                            $sum: "$marksheetDetails.netAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Marksheet not found",
                });
            }

            if (result.length > 0) {
                // const receiptDetails = await ReceiptdetailModel.find(filterQuery).lean();
                const receiptDetails = await ReceiptdetailModel.aggregate([
                    { $match: filterQuery },
                    {
                        $group: {
                            _id: "$msId",
                            msCode: { $first: "$msCode" },
                            totalPaidAmount: { $sum: "$paidAmount" },
                            receiptDetails: { $push: "$$ROOT" }
                        }
                    }
                ]);
                if (receiptDetails.length > 0) {
                    console.log("receiptDetails:", receiptDetails);
                    for (const item of result) {
                        console.log("SI ID:", item._id);
                        console.log("Marksheet Code:", item.msCode);
                        const msId = item._id;
                        const filtered = receiptDetails.filter(
                            row => row._id.toString() === msId.toString()
                        );
                        console.log("filtered:", filtered);
                        if (filtered.length > 0) {
                            item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
                        } else {
                            item.totalPaidAmount = 0;
                        }
                        item.balanceAmount = item.totalNetAmount - item.totalPaidAmount;
                    }
                    result = result.filter(
                        row => row.balanceAmount > 0
                    );
                    console.log("result:", result);

                }
            }



            res.status(200).json({
                success: true,
                data: result, // contains marksheet + marksheetDetails[]
            });

        } catch (e) {
            console.error("Error in getMarksheetWithStudentId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Marksheet",
            });
        }
    }
    ,
}