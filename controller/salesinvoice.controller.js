require("dotenv").config();
const mongoose = require("mongoose");
const Salesinvoice = require("../model/salesinvoice.model");
const Salesinvoicedetail = require("../model/salesinvoicedetail.model");

const ReceiptdetailModel = require("../model/receiptdetail.model");
module.exports = {

    getAllSalesinvoices: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allSalesinvoice = await Salesinvoice.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Salesinvoice", data: allSalesinvoice })
        } catch (error) {
            console.log("Error in getAllSalesinvoice", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Salesinvoice. Try later" })
        }

    },
    createSalesinvoice: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;

            // 1️⃣ Save sales invoice
            const newSalesinvoice = new Salesinvoice({
                ...req.body,
                school: schoolId,
            });

            const savedData = await newSalesinvoice.save();

            // 2️⃣ Map invoice details
            const siDetail = req.body.invoiceDetails || [];
            const siId = savedData._id || null;
            const salesInvoiceDetails = siDetail.map((item) => ({
                ...item,
                school: schoolId,
                siId: siId,
            }));

            // 3️⃣ Save invoice details
            if (salesInvoiceDetails.length > 0) {
                await Salesinvoicedetail.insertMany(salesInvoiceDetails);
            }

            // 4️⃣ Response
            res.status(200).json({
                success: true,
                data: savedData,
                message: "Salesinvoice is Created Successfully.",
            });

        } catch (e) {
            console.error("Error creating sales invoice:", e);
            res.status(500).json({
                success: false,
                message: "Failed Creation of Salesinvoice.",
            });
        }
    },
    getSalesinvoiceWithId: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Salesinvoice.aggregate([
                {
                    $match: {
                        _id: new mongoose.Types.ObjectId(id),
                        school: new mongoose.Types.ObjectId(schoolId),
                    },
                },

                {
                    $lookup: {
                        from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "siId",
                        as: "invoiceDetails",
                    },
                },
            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Salesinvoice not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains invoice + invoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getSalesinvoiceWithId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Salesinvoice",
            });
        }
    }
    ,

    updateSalesinvoiceWithId: async (req, res) => {
        // Not providing the  schoolId as salesinvoice Id will be unique.
        try {
            const schoolId = req.user.schoolId;

            let id = req.params.id;
            console.log(req.body)
            await Salesinvoice.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });

            // 2️⃣ Map invoice details
            const siDetail = req.body.invoiceDetails || [];
            const siId = id || null;
            const salesInvoiceDetails = siDetail.map((item) => ({
                ...item,
                school: schoolId,
                siId: siId,
            }));
            // 3️⃣ Save invoice details
            if (salesInvoiceDetails.length > 0) {
                await Salesinvoicedetail.deleteMany({
                    siId: siId,
                    school: schoolId
                });

                await Salesinvoicedetail.insertMany(salesInvoiceDetails);
            }
            const SalesinvoiceAfterUpdate = await Salesinvoice.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Salesinvoice Updated", data: SalesinvoiceAfterUpdate })
        } catch (error) {

            console.log("Error in updateSalesinvoiceWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Salesinvoice. Try later" })
        }

    },
    deleteSalesinvoiceWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;


            const receiptDetails = await ReceiptdetailModel.find({siId:id,status:"valid"}).lean();
            if (receiptDetails.length>0){
                res.status(500).json({ success: false, message: "Cannot Delete Invoice, Receipt is against this invoice" })
                return;
            }

            await Salesinvoice.findOneAndUpdate(
                { _id: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            await Salesinvoicedetail.updateMany(
                { siId: id },
                { $set: { status: "cancel" } },
                { new: true } // optional: returns updated document
            );
            // await Salesinvoice.findOneAndDelete({ _id: id, school: schoolId });
            const SalesinvoiceAfterDelete = await Salesinvoice.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Salesinvoice Deleted.", data: SalesinvoiceAfterDelete })


        } catch (error) {

            console.log("Error in updateSalesinvoiceWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Salesinvoice. Try later" })
        }

    },
    getSalesinvoicePrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Salesinvoice.aggregate([
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
                        localField: "class",      // field in salesinvoice
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
                // 🔹 Populate Student
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
                {
                    $lookup: {
                        from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "siId",
                        as: "invoiceDetails",
                    },
                },
                {
                    $lookup: {
                        from: "feestructures",
                        localField: "invoiceDetails.feestructure",
                        foreignField: "_id",
                        as: "feeStructureData",
                    },
                },
                {
                    $addFields: {
                        invoiceDetails: {
                            $map: {
                                input: "$invoiceDetails",
                                as: "detail",
                                in: {
                                    $mergeObjects: [
                                        "$$detail",
                                        {
                                            feestructure: {
                                                $arrayElemAt: [
                                                    {
                                                        $filter: {
                                                            input: "$feeStructureData",
                                                            as: "fs",
                                                            cond: {
                                                                $eq: ["$$fs._id", "$$detail.feestructure"],
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
                        feeStructureData: 0, // cleanup
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalGrossAmount: {
                            $sum: "$invoiceDetails.grossAmount",
                        },
                        totalDiscountAmount: {
                            $sum: "$invoiceDetails.discountAmount",
                        },
                        totalNetAmount: {
                            $sum: "$invoiceDetails.netAmount",
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

            res.status(200).json({
                success: true,
                data: result[0], // contains invoice + invoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getSalesinvoicePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getSalesinvoicePrint",
            });
        }
    },
    getSalesinvoiceWithStudentId: async (req, res) => {
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

            var result = await Salesinvoice.aggregate([
                {
                    $match: filterQuery,
                },

                {
                    $lookup: {
                        from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
                        localField: "_id",
                        foreignField: "siId",
                        as: "invoiceDetails",
                    },
                },
                // 🔹 SUM grossAmount
                {
                    $addFields: {
                        totalGrossAmount: {
                            $sum: "$invoiceDetails.grossAmount",
                        },
                        totalDiscountAmount: {
                            $sum: "$invoiceDetails.discountAmount",
                        },
                        totalNetAmount: {
                            $sum: "$invoiceDetails.netAmount",
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
                // const receiptDetails = await ReceiptdetailModel.find(filterQuery).lean();
                const receiptDetails = await ReceiptdetailModel.aggregate([
                    { $match: filterQuery },
                    {
                        $group: {
                            _id: "$siId",
                            siCode: { $first: "$siCode" },
                            totalPaidAmount: { $sum: "$paidAmount" },
                            receiptDetails: { $push: "$$ROOT" }
                        }
                    }
                ]);
                if (receiptDetails.length > 0) {
                    console.log("receiptDetails:", receiptDetails);
                    for (const item of result) {
                        console.log("SI ID:", item._id);
                        console.log("Invoice Code:", item.siCode);
                        const siId = item._id;
                        const filtered = receiptDetails.filter(
                            row => row._id.toString() === siId.toString()
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
                data: result, // contains invoice + invoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getSalesinvoiceWithStudentId", e);
            res.status(500).json({
                success: false,
                message: "Error fetching Salesinvoice",
            });
        }
    }
    ,
}