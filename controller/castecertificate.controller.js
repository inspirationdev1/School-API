require("dotenv").config();
const mongoose = require("mongoose");

const Castecertificate = require("../model/castecertificate.model");

module.exports = {

    getAllCastecertificates: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allCastecertificate = await Castecertificate.find({ school: schoolId }).populate('class').populate('section')
            .populate('student').populate('castecategory');
            res.status(200).json({ success: true, message: "Success in fetching all  Castecertificate", data: allCastecertificate })
        } catch (error) {
            console.log("Error in getAllCastecertificate", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Castecertificate. Try later" })
        }

    },
    createCastecertificate: (req, res) => {
        const schoolId = req.user.schoolId;
        const newCastecertificate = new Castecertificate({ ...req.body, school: schoolId });
        newCastecertificate.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Castecertificate is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getCastecertificateWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Castecertificate.findOne({ _id: id, school: schoolId }).populate('class').populate('section')
        .populate('student').populate('castecategory').then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Castecertificate data not Available" })
            }
        }).catch(e => {
            console.log("Error in getCastecertificateWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Castecertificate Data" })
        })
    },

    updateCastecertificateWithId: async (req, res) => {
        // Not providing the  schoolId as castecertificate Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Castecertificate.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const CastecertificateAfterUpdate = await Castecertificate.findOne({ _id: id }).populate('class').populate('section')
            .populate('student').populate('castecategory');
            res.status(200).json({ success: true, message: "Castecertificate Updated", data: CastecertificateAfterUpdate })
        } catch (error) {

            console.log("Error in updateCastecertificateWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Castecertificate. Try later" })
        }

    },
    deleteCastecertificateWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Castecertificate.findOneAndDelete({ _id: id, school: schoolId });
            const CastecertificateAfterDelete = await Castecertificate.findOne({ _id: id }).populate('class').populate('section')
            .populate('student').populate('castecategory');
            res.status(200).json({ success: true, message: "Castecertificate Deleted.", data: CastecertificateAfterDelete })



        } catch (error) {

            console.log("Error in updateCastecertificateWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Castecertificate. Try later" })
        }

    },
    getCastecertificatePrint: async (req, res) => {
            try {
                const id = req.params.id;
                const schoolId = req.user.schoolId;
    
                const result = await Castecertificate.aggregate([
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
                    // {
                    //     $lookup: {
                    //         from: "salesinvoicedetails", // 👈 collection name (IMPORTANT)
                    //         localField: "_id",
                    //         foreignField: "siId",
                    //         as: "invoiceDetails",
                    //     },
                    // },
                    // {
                    //     $lookup: {
                    //         from: "feestructures",
                    //         localField: "invoiceDetails.feestructure",
                    //         foreignField: "_id",
                    //         as: "feeStructureData",
                    //     },
                    // },
                    // {
                    //     $addFields: {
                    //         invoiceDetails: {
                    //             $map: {
                    //                 input: "$invoiceDetails",
                    //                 as: "detail",
                    //                 in: {
                    //                     $mergeObjects: [
                    //                         "$$detail",
                    //                         {
                    //                             feestructure: {
                    //                                 $arrayElemAt: [
                    //                                     {
                    //                                         $filter: {
                    //                                             input: "$feeStructureData",
                    //                                             as: "fs",
                    //                                             cond: {
                    //                                                 $eq: ["$$fs._id", "$$detail.feestructure"],
                    //                                             },
                    //                                         },
                    //                                     },
                    //                                     0,
                    //                                 ],
                    //                             },
                    //                         },
                    //                     ],
                    //                 },
                    //             },
                    //         },
                    //     },
                    // },
                    // {
                    //     $project: {
                    //         feeStructureData: 0, // cleanup
                    //     },
                    // },
                    // // 🔹 SUM grossAmount
                    // {
                    //     $addFields: {
                    //         totalGrossAmount: {
                    //             $sum: "$invoiceDetails.grossAmount",
                    //         },
                    //         totalDiscountAmount: {
                    //             $sum: "$invoiceDetails.discountAmount",
                    //         },
                    //         totalNetAmount: {
                    //             $sum: "$invoiceDetails.netAmount",
                    //         },
                    //     },
                    // },
                ]);
    
                if (!result.length) {
                    return res.status(404).json({
                        success: false,
                        message: "Castecertificate not found",
                    });
                }
    
                res.status(200).json({
                    success: true,
                    data: result[0], // contains invoice + invoiceDetails[]
                });
    
            } catch (e) {
                console.error("Error in getCastecertificatePrint", e);
                res.status(500).json({
                    success: false,
                    message: "Error fetching getCastecertificatePrint",
                });
            }
        },
}