require("dotenv").config();
const mongoose = require("mongoose");

const Bonafidecertificate = require("../model/bonafidecertificate.model");

module.exports = {

    getAllBonafidecertificates: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allBonafidecertificate = await Bonafidecertificate.find({ school: schoolId }).populate('class').populate('section').populate('student');
            res.status(200).json({ success: true, message: "Success in fetching all  Bonafidecertificate", data: allBonafidecertificate })
        } catch (error) {
            console.log("Error in getAllBonafidecertificate", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Bonafidecertificate. Try later" })
        }

    },
    createBonafidecertificate: (req, res) => {
        const schoolId = req.user.schoolId;
        const newBonafidecertificate = new Bonafidecertificate({ ...req.body, school: schoolId });
        newBonafidecertificate.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Bonafidecertificate is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getBonafidecertificateWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Bonafidecertificate.findOne({ _id: id, school: schoolId }).populate('class').populate('section').populate('student').then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Bonafidecertificate data not Available" })
            }
        }).catch(e => {
            console.log("Error in getBonafidecertificateWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Bonafidecertificate Data" })
        })
    },

    updateBonafidecertificateWithId: async (req, res) => {
        // Not providing the  schoolId as bonafidecertificate Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Bonafidecertificate.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const BonafidecertificateAfterUpdate = await Bonafidecertificate.findOne({ _id: id }).populate('class').populate('section').populate('student');
            res.status(200).json({ success: true, message: "Bonafidecertificate Updated", data: BonafidecertificateAfterUpdate })
        } catch (error) {

            console.log("Error in updateBonafidecertificateWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Bonafidecertificate. Try later" })
        }

    },
    deleteBonafidecertificateWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Bonafidecertificate.findOneAndDelete({ _id: id, school: schoolId });
            const BonafidecertificateAfterDelete = await Bonafidecertificate.findOne({ _id: id }).populate('class').populate('section').populate('student');
            res.status(200).json({ success: true, message: "Bonafidecertificate Deleted.", data: BonafidecertificateAfterDelete })



        } catch (error) {

            console.log("Error in updateBonafidecertificateWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Bonafidecertificate. Try later" })
        }

    },
    getBonafidecertificatePrint: async (req, res) => {
            try {
                const id = req.params.id;
                const schoolId = req.user.schoolId;
    
                const result = await Bonafidecertificate.aggregate([
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
                        message: "Bonafidecertificate not found",
                    });
                }
    
                res.status(200).json({
                    success: true,
                    data: result[0], // contains invoice + invoiceDetails[]
                });
    
            } catch (e) {
                console.error("Error in getBonafidecertificatePrint", e);
                res.status(500).json({
                    success: false,
                    message: "Error fetching getBonafidecertificatePrint",
                });
            }
        },
}