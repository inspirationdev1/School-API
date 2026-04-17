require("dotenv").config();
const mongoose = require("mongoose");

const Transfercertificate = require("../model/transfercertificate.model");

module.exports = {

    getAllTransfercertificates: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allTransfercertificate = await Transfercertificate.find({ school: schoolId }).populate('class').populate('section').populate('student');
            res.status(200).json({ success: true, message: "Success in fetching all  Transfercertificate", data: allTransfercertificate })
        } catch (error) {
            console.log("Error in getAllTransfercertificate", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Transfercertificate. Try later" })
        }

    },
    createTransfercertificate: (req, res) => {
        const schoolId = req.user.schoolId;
        const newTransfercertificate = new Transfercertificate({ ...req.body, school: schoolId });
        newTransfercertificate.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Transfercertificate is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getTransfercertificateWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Transfercertificate.findOne({ _id: id, school: schoolId }).populate('class').populate('section').populate('student').then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Transfercertificate data not Available" })
            }
        }).catch(e => {
            console.log("Error in getTransfercertificateWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Transfercertificate Data" })
        })
    },

    updateTransfercertificateWithId: async (req, res) => {
        // Not providing the  schoolId as transfercertificate Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Transfercertificate.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const TransfercertificateAfterUpdate = await Transfercertificate.findOne({ _id: id }).populate('class').populate('section').populate('student');
            res.status(200).json({ success: true, message: "Transfercertificate Updated", data: TransfercertificateAfterUpdate })
        } catch (error) {

            console.log("Error in updateTransfercertificateWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Transfercertificate. Try later" })
        }

    },
    deleteTransfercertificateWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Transfercertificate.findOneAndDelete({ _id: id, school: schoolId });
            const TransfercertificateAfterDelete = await Transfercertificate.findOne({ _id: id }).populate('class').populate('section').populate('student');
            res.status(200).json({ success: true, message: "Transfercertificate Deleted.", data: TransfercertificateAfterDelete })



        } catch (error) {

            console.log("Error in updateTransfercertificateWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Transfercertificate. Try later" })
        }

    },
    getTransfercertificatePrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Transfercertificate.aggregate([
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

            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Transfercertificate not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains invoice + invoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getTransfercertificatePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getTransfercertificatePrint",
            });
        }
    },
}