require("dotenv").config();
const mongoose = require("mongoose");
const Receipt = require("../model/receipt.model");
const Receiptdetail = require("../model/receiptdetail.model");

const { getNumberseqWithScreenId, updateNumberseqWithScreenId } = require("../controller/numberseq.controller");
module.exports = {

    getAllReceipts: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allReceipt = await Receipt.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Receipt", data: allReceipt })
        } catch (error) {
            console.log("Error in getAllReceipt", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Receipt. Try later" })
        }

    },
    createReceipt: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;


            //***Number seq */
            const numberseqData = await getNumberseqWithScreenId({ screen_id: "receipt", schoolId: req.user.schoolId });
            console.log("numberseqData.data", numberseqData);
            let seq = 1;
            let code = "";
            if (numberseqData) {
                seq = numberseqData.seq || 1;
                code = numberseqData.code || "";
            }
            //****** */

            // 1️⃣ Save receipt
            const newReceipt = new Receipt({
                ...req.body,
                receiptCode: code,
                seq: seq,
                school: schoolId,
            });

            const savedData = await newReceipt.save();

            // 2️⃣ Map receiptDetails
            const recDetail = req.body.receiptDetails || [];
            const recId = savedData._id || null;
            const receiptDetails = recDetail.map((item) => ({
                ...item,
                school: schoolId,
                receiptId: recId,
            }));

            // 3️⃣ Save receiptDetails
            if (receiptDetails.length > 0) {
                await Receiptdetail.insertMany(receiptDetails);
            }

            // ****Update Number Seq****
            const numberseqAfterUpdate = await updateNumberseqWithScreenId({ screen_id: "receipt", schoolId: req.user.schoolId });
            console.log("numberseqAfterUpdate", numberseqAfterUpdate);
            // *********************

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Receipt is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating receipt:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Receipt.",
            });
        }
    },
    getReceiptWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Receipt.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },

                {
                    $lookup: {
                        from: "receiptdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "receiptId",
                        as: "receiptDetails",
                    },
                },

                {
                    $lookup: {
                        from: "salesinvoices",
                        localField: "receiptDetails.siId",
                        foreignField: "_id",
                        as: "salesInvoiceData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            siId: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$salesInvoiceData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.siId"],
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
                        salesInvoiceData: 0, // cleanup
                    },
                },
                {
                    $lookup: {
                        from: "students",
                        localField: "receiptDetails.student",
                        foreignField: "_id",
                        as: "studentData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
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
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Receipt not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains receipt + receiptDetails[]
            });

        } catch (e) {
            console.error("Error in getReceiptWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Receipt",
            });
        }
    }
    ,

    updateReceiptWithId: async (req, res) => {
        // Not providing the  schoolId as receipt Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Receipt.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map receiptDetails
            const recDetail = req.body.receiptDetails || [];
            const recId = id || null;
            const receiptDetails = recDetail.map((item) => ({
                ...item,
                school: schoolId,
                receiptId: recId,
            }));
            // 3️⃣ Save receipt details
            if (receiptDetails.length > 0) {
                await Receiptdetail.deleteMany({
                    receiptId: recId,
                    school: schoolId
                });

                await Receiptdetail.insertMany(receiptDetails);
            }
            const ReceiptAfterUpdate = await Receipt.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Receipt Updated", data: ReceiptAfterUpdate })
        } catch (error) {

            console.log("Error in updateReceiptWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Receipt. Try later" })
        }

    },
    deleteReceiptWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Receipt.findOneAndUpdate(
                { _id: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            await Receiptdetail.updateMany(
                { receiptId: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            // await Receipt.findOneAndDelete({ _id: id, school: schoolId });
            const ReceiptAfterDelete = await Receipt.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Receipt Deleted.", data: ReceiptAfterDelete })


        } catch (error) {

            console.log("Error in updateReceiptWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Receipt. Try later" })
        }

    },
    getReceiptPrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Receipt.aggregate([
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
                {
                    $lookup: {
                        from: "receiptdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "receiptId",
                        as: "receiptDetails",
                    },
                },
                // 🔹 Populate Student
                {
                    $lookup: {
                        from: "students",
                        localField: "receiptDetails.student",
                        foreignField: "_id",
                        as: "studentData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
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
                 // 🔹 Populate Parent
                {
                    $lookup: {
                        from: "parents",
                        localField: "receiptDetails.parent",
                        foreignField: "_id",
                        as: "parentData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            parent: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$parentData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.parent"],
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
                        parentData: 0, // cleanup
                    },
                },
                // 🔹 Populate Class
                {
                    $lookup: {
                        from: "classes",
                        localField: "receiptDetails.class",
                        foreignField: "_id",
                        as: "classData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            class: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$classData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.class"],
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
                        classData: 0, // cleanup
                    },
                },
                // 🔹 Populate Section
                {
                    $lookup: {
                        from: "sections",
                        localField: "receiptDetails.section",
                        foreignField: "_id",
                        as: "sectionData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            section: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$sectionData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.section"],
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
                        sectionData: 0, // cleanup
                    },
                },
                // 🔹 Populate Sales Invoicedetail
                {
                    $lookup: {
                        from: "salesinvoicedetails", // collection name
                        localField: "receiptDetails.siId",
                        foreignField: "siId",
                        as: "salesInvoiceData",
                    },
                },
                {
                    $addFields: {
                        receiptDetails: {
                            $map: {
                                input: "$receiptDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            siId: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$salesInvoiceData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs.siId", "$$detail.siId"],
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
                        salesInvoiceData: 0, // cleanup
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalinvAmount: {
                            $sum: "$receiptDetails.invAmount",
                        },
                        totalpaidAmount: {
                            $sum: "$receiptDetails.paidAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Receipt not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains receipt + receiptDetails[]
            });

        } catch (e) {
            console.error("Error in getReceiptPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getReceiptPrint",
            });
        }
    }
}