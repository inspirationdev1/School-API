require("dotenv").config();
const mongoose = require("mongoose");

const Attendee = require("../model/attendee.model");

module.exports = {

    getAllAttendees: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allAttendee = await Attendee.find({ school: schoolId }).populate('class').populate('section').populate('teacher');
            res.status(200).json({ success: true, message: "Success in fetching all  Attendee", data: allAttendee })
        } catch (error) {
            console.log("Error in getAllAttendee", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Attendee. Try later" })
        }

    },
    createAttendee: (req, res) => {
        const schoolId = req.user.schoolId;
        const newAttendee = new Attendee({ ...req.body, school: schoolId });
        newAttendee.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Attendee is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            if (e.code === 11000) {
                return res.status(400).json({ success: false,message: "Class,Section & Teacher already exists" });
            }
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getAttendeeWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Attendee.findOne({ _id: id, school: schoolId }).populate('class').populate('section').populate('teacher').then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Attendee data not Available" })
            }
        }).catch(e => {
            console.log("Error in getAttendeeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Attendee Data" })
        })
    },

    updateAttendeeWithId: async (req, res) => {
        // Not providing the  schoolId as attendee Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Attendee.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const AttendeeAfterUpdate = await Attendee.findOne({ _id: id }).populate('class').populate('section').populate('teacher');
            res.status(200).json({ success: true, message: "Attendee Updated", data: AttendeeAfterUpdate })
        } catch (error) {

            console.log("Error in updateAttendeeWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Attendee. Try later" })
        }

    },
    deleteAttendeeWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Attendee.findOneAndDelete({ _id: id, school: schoolId });
            const AttendeeAfterDelete = await Attendee.findOne({ _id: id }).populate('class').populate('section').populate('teacher');
            res.status(200).json({ success: true, message: "Attendee Deleted.", data: AttendeeAfterDelete })



        } catch (error) {

            console.log("Error in updateAttendeeWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Attendee. Try later" })
        }

    },
    getAttendeePrint: async (req, res) => {
        try {
            const id = req.params.id;
            const schoolId = req.user.schoolId;

            const result = await Attendee.aggregate([
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

            ]);

            if (!result.length) {
                return res.status(404).json({
                    success: false,
                    message: "Attendee not found",
                });
            }

            res.status(200).json({
                success: true,
                data: result[0], // contains invoice + invoiceDetails[]
            });

        } catch (e) {
            console.error("Error in getAttendeePrint", e);
            res.status(500).json({
                success: false,
                message: "Error fetching getAttendeePrint",
            });
        }
    },
}