require("dotenv").config();
const mongoose = require("mongoose");
const Journalvoucher = require("../model/journalvoucher.model");
const Journalvoucherdetail = require("../model/journalvoucherdetail.model");
const paymentdetailModel = require("../model/paymentdetail.model");
const { getNumberseqWithScreenId, updateNumberseqWithScreenId } = require("../controller/numberseq.controller");

module.exports = {

    getAllJournalvouchers: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allJournalvoucher = await Journalvoucher.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Journalvoucher", data: allJournalvoucher })
        } catch (error) {
            console.log("Error in getAllJournalvoucher", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Journalvoucher. Try later" })
        }

    },
    createJournalvoucher: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

             //***Number seq */
            const numberseqData = await getNumberseqWithScreenId({ screen_id: "journalvoucher", schoolId: req.user.schoolId });
            console.log("numberseqData.data", numberseqData);
            let seq = 1;
            let code = "";
            if (numberseqData) {
                seq = numberseqData.seq || 1;
                code = numberseqData.code || "";
            }
            //****** */

            // 1️⃣ Save journalvoucher
            const newJournalvoucher = new Journalvoucher({
                ...req.body,
                school: schoolId,
                jv_code: code,
                seq: seq
            });

            const savedData = await newJournalvoucher.save();

            // 2️⃣ Map journalvoucherDetails
            const jvDetail = req.body.journalvoucherDetails || [];
            const jv_id = savedData._id || null;
            const journalvoucherDetails = jvDetail.map((item) => ({
                ...item,
                school: schoolId,
                jv_id: jv_id,
            }));

            // 3️⃣ Save journalvoucherDetails
            if (journalvoucherDetails.length > 0) {
                await Journalvoucherdetail.insertMany(journalvoucherDetails);
            }


            // ****Update Number Seq****
            const numberseqAfterUpdate = await updateNumberseqWithScreenId({ screen_id: "journalvoucher", schoolId: req.user.schoolId });
            console.log("numberseqAfterUpdate", numberseqAfterUpdate);
            // *********************

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Journalvoucher is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating journalvoucher:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Journalvoucher.",
            });
        }
    },
    getJournalvoucherWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Journalvoucher.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },
                // 🧑‍💼 EMPLOYEE POPULATE
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee",
                        foreignField: "_id",
                        as: "employee"
                    }
                },
                {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "journalvoucherdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "journalvoucherId",
                        as: "journalvoucherDetails",
                    },
                },

                {
                    $lookup: {
                        from: "journalvouchertypes",
                        localField: "journalvoucherDetails.journalvouchertype",
                        foreignField: "_id",
                        as: "journalvoucherTypeData",
                    },
                },
                {
                    $addFields: {
                        journalvoucherDetails: {
                            $map: {
                                input: "$journalvoucherDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            journalvouchertype: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$journalvoucherTypeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.journalvouchertype"],
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
                        journalvoucherTypeData: 0, // cleanup
                    },
                },
                {
                    $lookup: {
                        from: "journalvouchertypes",
                        localField: "journalvoucherDetails.journalvouchertype",
                        foreignField: "_id",
                        as: "journalvoucherTypeData",
                    },
                },
                {
                    $addFields: {
                        journalvoucherDetails: {
                            $map: {
                                input: "$journalvoucherDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            journalvouchertype: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$journalvoucherTypeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.journalvouchertype"],
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
                        journalvoucherTypeData: 0, // cleanup
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Journalvoucher not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains journalvoucher + journalvoucherDetails[]
            });

        } catch (e) {
            console.error("Error in getJournalvoucherWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Journalvoucher",
            });
        }
    }
    ,

    updateJournalvoucherWithId: async (req, res) => {
        // Not providing the  schoolId as journalvoucher Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Journalvoucher.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map journalvoucherDetails
            const expDetail = req.body.journalvoucherDetails || [];
            const expId = id || null;
            const journalvoucherDetails = expDetail.map((item) => ({
                ...item,
                school: schoolId,
                journalvoucherId: expId,
            }));
            // 3️⃣ Save journalvoucher details
            if (journalvoucherDetails.length > 0) {
                await Journalvoucherdetail.deleteMany({
                    journalvoucherId: expId,
                    school: schoolId
                });

                await Journalvoucherdetail.insertMany(journalvoucherDetails);
            }
            const JournalvoucherAfterUpdate = await Journalvoucher.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Journalvoucher Updated", data: JournalvoucherAfterUpdate })
        } catch (error) {

            console.log("Error in updateJournalvoucherWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Journalvoucher. Try later" })
        }

    },
    deleteJournalvoucherWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Journalvoucher.findOneAndUpdate(
                { _id: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            await Journalvoucherdetail.updateMany(
                { journalvoucherId: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            // await Journalvoucher.findOneAndDelete({ _id: id, school: schoolId });
            const JournalvoucherAfterDelete = await Journalvoucher.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Journalvoucher Deleted.", data: JournalvoucherAfterDelete })



        } catch (error) {

            console.log("Error in updateJournalvoucherWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Journalvoucher. Try later" })
        }

    },
    getJournalvoucherWithEmployeeId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const filterQuery = {};
            filterQuery['school'] = new mongoose.Types.ObjectId(schoolId);


            if (req.query.hasOwnProperty('employee')) {
                const employeeId = req.query.employee;
                filterQuery['employee'] = new mongoose.Types.ObjectId(employeeId);
            }
            filterQuery['status'] = "valid";

            var result = await Journalvoucher.aggregate([
                {
                    $match: filterQuery,
                },

                {
                    $lookup: {
                        from: "journalvoucherdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "journalvoucherId",
                        as: "journalvoucherDetails",
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalJournalvoucherAmount: {
                            $sum: "$journalvoucherDetails.journalvoucherAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Salesinvoice not found",
                });
            }

            if (result.length > 0) {

                const paymentDetails = await paymentdetailModel.aggregate([
                    { $match: filterQuery },
                    {
                        $group: {
                            _id: "$journalvoucherId",
                            journalvoucherCode: { $first: "$journalvoucherCode" },
                            totalPaidAmount: { $sum: "$paidAmount" },
                            journalvoucherDetails: { $push: "$$ROOT" }
                        }
                    }
                ]);
                if (paymentDetails.length > 0) {
                    console.log("paymentDetails:", paymentDetails);
                    for (const item of result) {
                        console.log("SI ID:", item._id);
                        console.log("Invoice Code:", item.journalvoucherCode);
                        const journalvoucherId = item._id;
                        const filtered = paymentDetails.filter(
                            row => row._id.toString() === journalvoucherId.toString()
                        );
                        console.log("filtered:", filtered);
                        if (filtered.length > 0) {
                            item.totalPaidAmount = filtered[0].totalPaidAmount || 0;
                        } else {
                            item.totalPaidAmount = 0;
                        }
                        item.balanceAmount = item.totalJournalvoucherAmount - item.totalPaidAmount;
                    }
                    result = result.filter(
                        row => row.balanceAmount > 0
                    );
                    console.log("result:", result);

                }
            }



            res.status(200).json({
                success: true,
                data: result, // contains invoice + journalvoucherDetails[]
            });

        } catch (e) {
            console.error("Error in getJournalvoucherWithEmployeeId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Salesinvoice",
            });
        }
    }
    ,
    getJournalvoucherPrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Journalvoucher.aggregate([
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

                // 🧑‍💼 EMPLOYEE POPULATE
                {
                    $lookup: {
                        from: "employees",
                        localField: "employee",
                        foreignField: "_id",
                        as: "employee"
                    }
                },
                {
                    $unwind: {
                        path: "$employee",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: "journalvoucherdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "journalvoucherId",
                        as: "journalvoucherDetails",
                    },
                },
                {
                    $lookup: {
                        from: "journalvouchertypes",
                        localField: "journalvoucherDetails.journalvouchertype",
                        foreignField: "_id",
                        as: "journalvoucherTypeData",
                    },
                },
                {
                    $addFields: {
                        journalvoucherDetails: {
                            $map: {
                                input: "$journalvoucherDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            journalvouchertype: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$journalvoucherTypeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.journalvouchertype"],
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
                        journalvoucherTypeData: 0, // cleanup
                    },
                },

                // 🔹 SUM journalvoucherAmount
                {
                    $addFields: {
                        totaljournalvoucherAmount: {
                            $sum: "$journalvoucherDetails.journalvoucherAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Journalvoucher not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains journalvoucher + journalvoucherDetails[]
            });

        } catch (e) {
            console.error("Error in getJournalvoucherPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getJournalvoucherPrint",
            });
        }
    }
}