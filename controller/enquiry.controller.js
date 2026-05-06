require("dotenv").config();
const mongoose = require("mongoose");
const Enquiry = require("../model/enquiry.model");
const Enquirydetail = require("../model/enquirydetail.model");

const ReceiptdetailModel = require("../model/receiptdetail.model");
module.exports = {

    getAllEnquirys: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allEnquiry = await Enquiry.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Enquiry", data: allEnquiry })
        } catch (error) {
            console.log("Error in getAllEnquiry", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Enquiry. Try later" })
        }

    },
    createEnquiry: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            // 1️⃣ Save enquiry
            const newEnquiry = new Enquiry({
                ...req.body,
                school: schoolId,
            });

            const savedData = await newEnquiry.save();

            // 2️⃣ Map enquiry details
            const msDetail = req.body.enquiryDetails || [];
            const enquiry_id = savedData._id || null;
            const enquiryDetails = msDetail.map((item) => ({
                ...item,
                school: schoolId,
                enquiry_id: enquiry_id,
            }));

            // 3️⃣ Save enquiry details
            if (enquiryDetails.length > 0) {
                await Enquirydetail.insertMany(enquiryDetails);
            }

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Enquiry is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating Enquiry:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Enquiry.",
            });
        }
    },
    getEnquiryWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;



            const result = await Enquiry.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },

                // ✅ 1. Fetch enquiryDetails FIRST
                {
                    $lookup: {
                        from: "enquirydetails",
                        localField: "_id",
                        foreignField: "enquiry_id",
                        as: "enquiryDetails",
                    },
                },

                // ✅ 2. Fetch classes
                {
                    $lookup: {
                        from: "classes",
                        localField: "enquiryDetails.class",
                        foreignField: "_id",
                        as: "classesData",
                    },
                },

                // ✅ 3. Fetch boards
                {
                    $lookup: {
                        from: "generalmasters",
                        localField: "enquiryDetails.board",
                        foreignField: "_id",
                        as: "boardsData",
                    },
                },
                // ✅ 3. Fetch previousschool
                {
                    $lookup: {
                        from: "generalmasters",
                        localField: "enquiryDetails.previousschool",
                        foreignField: "_id",
                        as: "previousschoolData",
                    },
                },

                // ✅ 4. Merge populated data into enquiryDetails
                {
                    $addFields: {
                        enquiryDetails: {
                            $map: {
                                input: "$enquiryDetails",
                                as: "item",
                                in: {
                                    $mergeObjects: [
                                        "$$item",
                                        {
                                            class: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$classesData",
                                                            as: "c",
                                                            cond: { $eq: ["$$c._id", "$$item.class"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            board: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$boardsData",
                                                            as: "b",
                                                            cond: { $eq: ["$$b._id", "$$item.board"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            previousschool: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$previousschoolData",
                                                            as: "b",
                                                            cond: { $eq: ["$$b._id", "$$item.previousschool"] },
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
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains enquiry + enquiryDetails[]
            });

        } catch (e) {
            console.error("Error in getEnquiryWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Enquiry",
            });
        }
    }
    ,

    updateEnquiryWithId: async (req, res) => {
        // Not providing the  schoolId as enquiry Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Enquiry.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map enquiry details
            const msDetail = req.body.enquiryDetails || [];
            const enquiry_id = id || null;
            const enquiryDetails = msDetail.map((item) => ({
                ...item,
                school: schoolId,
                enquiry_id: enquiry_id,
            }));
            // 3️⃣ Save Enquiry details
            if (enquiryDetails.length > 0) {
                await Enquirydetail.deleteMany({
                    enquiry_id: enquiry_id,
                    school: schoolId
                });

                await Enquirydetail.insertMany(enquiryDetails);
            }
            const EnquiryAfterUpdate = await Enquiry.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Enquiry Updated", data: EnquiryAfterUpdate })
        } catch (error) {

            console.log("Error in updateEnquiryWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Enquiry. Try later" })
        }

    },
    deleteEnquiryWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Enquiry.findOneAndUpdate(
                { _id: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            await Enquirydetail.updateMany(
                { enquiry_id: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            // await Enquiry.findOneAndDelete({ _id: id, school: schoolId });
            const EnquiryAfterDelete = await Enquiry.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Enquiry Deleted.", data: EnquiryAfterDelete })



        } catch (error) {

            console.log("Error in updateEnquiryWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Enquiry. Try later" })
        }

    },
    getEnquiryPrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Enquiry.aggregate([
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

                // ✅ 1. Fetch enquiryDetails FIRST
                {
                    $lookup: {
                        from: "enquirydetails",
                        localField: "_id",
                        foreignField: "enquiry_id",
                        as: "enquiryDetails",
                    },
                },

                // ✅ 2. Fetch classes
                {
                    $lookup: {
                        from: "classes",
                        localField: "enquiryDetails.class",
                        foreignField: "_id",
                        as: "classesData",
                    },
                },

                // ✅ 3. Fetch boards
                {
                    $lookup: {
                        from: "generalmasters",
                        localField: "enquiryDetails.board",
                        foreignField: "_id",
                        as: "boardsData",
                    },
                },
                // ✅ 3. Fetch previousschool
                {
                    $lookup: {
                        from: "generalmasters",
                        localField: "enquiryDetails.previousschool",
                        foreignField: "_id",
                        as: "previousschoolData",
                    },
                },

                // ✅ 4. Merge populated data into enquiryDetails
                {
                    $addFields: {
                        enquiryDetails: {
                            $map: {
                                input: "$enquiryDetails",
                                as: "item",
                                in: {
                                    $mergeObjects: [
                                        "$$item",
                                        {
                                            class: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$classesData",
                                                            as: "c",
                                                            cond: { $eq: ["$$c._id", "$$item.class"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            board: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$boardsData",
                                                            as: "b",
                                                            cond: { $eq: ["$$b._id", "$$item.board"] },
                                                        },
                                                    },
                                                    0,
                                                ],
                                            },
                                            previousschool: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$previousschoolData",
                                                            as: "b",
                                                            cond: { $eq: ["$$b._id", "$$item.previousschool"] },
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
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains enquiry + enquiryDetails[]
            });

        } catch (e) {
            console.error("Error in getEnquiryPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getEnquiryPrint",
            });
        }
    },
    getEnquiryWithStudentId: async (req, res) => {
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

            var result = await Enquiry.aggregate([
                {
                    $match: filterQuery,
                },

                {
                    $lookup: {
                        from: "enquirydetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "enquiry_id",
                        as: "enquiryDetails",
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalGrossAmount: {
                            $sum: "$enquiryDetails.grossAmount",
                        },
                        totalDiscountAmount: {
                            $sum: "$enquiryDetails.discountAmount",
                        },
                        totalNetAmount: {
                            $sum: "$enquiryDetails.netAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Enquiry not found",
                });
            }

            if (result.length > 0) {
                // const receiptDetails = await ReceiptdetailModel.find(filterQuery).lean();
                const receiptDetails = await ReceiptdetailModel.aggregate([
                    { $match: filterQuery },
                    {
                        $group: {
                            _id: "$enquiry_id",
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
                        console.log("Enquiry Code:", item.msCode);
                        const enquiry_id = item._id;
                        const filtered = receiptDetails.filter(
                            row => row._id.toString() === enquiry_id.toString()
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
                data: result, // contains enquiry + enquiryDetails[]
            });

        } catch (e) {
            console.error("Error in getEnquiryWithStudentId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Enquiry",
            });
        }
    }
    ,
}