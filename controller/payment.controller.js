require("dotenv").config();
const mongoose = require("mongoose");
const Payment = require("../model/payment.model");
const Paymentdetail = require("../model/paymentdetail.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {

    getAllPayments: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allPayment = await Payment.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Payment", data: allPayment })
        } catch (error) {
            console.log("Error in getAllPayment", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Payment. Try later" })
        }

    },
    createPayment: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            // 1️⃣ Save payment
            const newPayment = new Payment({
                ...req.body,
                school: schoolId,
            });

            const savedData = await newPayment.save();

            // 2️⃣ Map paymentDetails
            const payDetail = req.body.paymentDetails || [];
            const payId = savedData._id || null;
            const paymentDetails = payDetail.map((item) => ({
                ...item,
                school: schoolId,
                paymentId: payId,
            }));

            // 3️⃣ Save paymentDetails
            if (paymentDetails.length > 0) {
                await Paymentdetail.insertMany(paymentDetails);
            }

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Payment is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating payment:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Payment.",
            });
        }
    },
    getPaymentWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Payment.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },

                {
                    $lookup: {
                        from: "paymentdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "paymentId",
                        as: "paymentDetails",
                    },
                },
                
                {
                    $lookup: {
                        from: "expenses",
                        localField: "paymentDetails.expenseId",
                        foreignField: "_id",
                        as: "expenseData",
                    },
                },
                {
                    $addFields: {
                        paymentDetails: {
                            $map: {
                                input: "$paymentDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            expenseId: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$expenseData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.expenseId"],
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
                        expenseData: 0, // cleanup
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "paymentDetails.employee",
                        foreignField: "_id",
                        as: "employeeData",
                    },
                },
                {
                    $addFields: {
                        paymentDetails: {
                            $map: {
                                input: "$paymentDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            employee: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$employeeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.employee"],
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
                        employeeData: 0, // cleanup
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains payment + paymentDetails[]
            });

        } catch (e) {
            console.error("Error in getPaymentWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Payment",
            });
        }
    }
    ,

    updatePaymentWithId: async (req, res) => {
        // Not providing the  schoolId as payment Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Payment.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map paymentDetails
            const payDetail = req.body.paymentDetails || [];
            const payId = id || null;
            const paymentDetails = payDetail.map((item) => ({
                ...item,
                school: schoolId,
                paymentId: payId,
            }));
            // 3️⃣ Save payment details
            if (paymentDetails.length > 0) {
                await Paymentdetail.deleteMany({
                    paymentId: payId,
                    school: schoolId
                });

                await Paymentdetail.insertMany(paymentDetails);
            }
            const PaymentAfterUpdate = await Payment.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Payment Updated", data: PaymentAfterUpdate })
        } catch (error) {

            console.log("Error in updatePaymentWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Payment. Try later" })
        }

    },
    deletePaymentWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
                await Payment.findOneAndUpdate(
                    { _id: id },
                    { $set: { status: "cancel" } },
                    { new: true } // optional: returns updated document
                );
                await Paymentdetail.updateMany(
                    { paymentId: id },
                    { $set: { status: "cancel" } },
                    { new: true } // optional: returns updated document
                );
                // await Payment.findOneAndDelete({ _id: id, school: schoolId });
                const PaymentAfterDelete = await Payment.findOne({ _id: id });
                res.status(200).json({ success: true, message: "Payment Deleted.", data: PaymentAfterDelete })
            


        } catch (error) {

            console.log("Error in updatePaymentWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Payment. Try later" })
        }

    },
    getPaymentPrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Payment.aggregate([
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
                        from: "paymentdetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "paymentId",
                        as: "paymentDetails",
                    },
                },
                {
                    $lookup: {
                        from: "employees",
                        localField: "paymentDetails.employee",
                        foreignField: "_id",
                        as: "employeeData",
                    },
                },
                {
                    $addFields: {
                        paymentDetails: {
                            $map: {
                                input: "$paymentDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            employee: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$employeeData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.employee"],
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
                        employeeData: 0, // cleanup
                    },
                },
                
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalexpenseAmount: {
                            $sum: "$paymentDetails.expenseAmount",
                        },
                        totalpaidAmount: {
                            $sum: "$paymentDetails.paidAmount",
                        },
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Payment not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains payment + paymentDetails[]
            });

        } catch (e) {
            console.error("Error in getPaymentPrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getPaymentPrint",
            });
        }
    }
}