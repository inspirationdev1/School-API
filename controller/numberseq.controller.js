require("dotenv").config();
const mongoose = require("mongoose");

const Numberseq = require("../model/numberseq.model");
const Screen = require("../model/screen.model");

module.exports = {

    getAllNumberseqs: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allNumberseq = await Numberseq.find({ school: schoolId }).populate("screen");
            res.status(200).json({ success: true, message: "Success in fetching all  Numberseq", data: allNumberseq })
        } catch (error) {
            console.log("Error in getAllNumberseq", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Numberseq. Try later" })
        }

    },
    createNumberseq: (req, res) => {
        const schoolId = req.user.schoolId;
        const newNumberseq = new Numberseq({ ...req.body, school: schoolId });
        newNumberseq.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Numberseq is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: "Failed Creation of Numberseq." })
        })

    },
    getNumberseqWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Numberseq.findOne({ _id: id, school: schoolId }).populate("screen").then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Numberseq data not Available" })
            }
        }).catch(e => {
            console.log("Error in getNumberseqWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Numberseq Data" })
        })
    },

    updateNumberseqWithId: async (req, res) => {
        // Not providing the  schoolId as numberseq Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Numberseq.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const NumberseqAfterUpdate = await Numberseq.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Numberseq Updated", data: NumberseqAfterUpdate })
        } catch (error) {

            console.log("Error in updateNumberseqWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Numberseq. Try later" })
        }

    },
    deleteNumberseqWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Numberseq.findOneAndDelete({ _id: id, school: schoolId });
            const NumberseqAfterDelete = await Numberseq.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Numberseq Deleted.", data: NumberseqAfterDelete })



        } catch (error) {

            console.log("Error in updateNumberseqWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Numberseq. Try later" })
        }

    },
    getNumberseqWithScreenId: async (req, res) => {

        const screen_name = req.screen_name;
        const schoolId = req.schoolId;
        try {

            const screenData = await Screen.find({
                screen_name: screen_name
            }).lean();

            let screenId = ""
            if (screenData.length > 0) {
                screenId = screenData[0]._id;
            }

            const numberseqData = await Numberseq.find({
                screen: new mongoose.Types.ObjectId(screenId),
                school: new mongoose.Types.ObjectId(schoolId)
            }).populate("screen").lean();

            let seq = 0;
            let code = "";
            let prefix = "";
            let suffix = "";
            if (numberseqData.length > 0) {
                seq = numberseqData[0].seq || 0;
                prefix = numberseqData[0].prefix || "";
                suffix = numberseqData[0].suffix || "";
            }
            code = prefix + seq + suffix;
            const seqData = {
                seq: seq,
                code: code
            }
            return seqData;
        } catch (error) {
            console.log("Error in getNumberseqWithId", error.message)
            return { success: false, message: "Error in getting  Numberseq Data" }
        }

    },
    updateNumberseqWithScreenId: async (req, res) => {
        // Not providing the  schoolId as numberseq Id will be unique.
        try {
            // let id = req.params.id;
            const screen_name = req.screen_name;
            const schoolId = req.schoolId;
            const screenData = await Screen.find({
                screen_name: screen_name,
                school: new mongoose.Types.ObjectId(schoolId)
            }).lean();

            let screenId = ""
            if (screenData.length > 0) {
                screenId = screenData[0]._id;
            }






            const numberSeqData = await Numberseq.find({
                screen: screenId,
                school: new mongoose.Types.ObjectId(schoolId)
            }).lean();

            let id = "";
            if (numberSeqData.length > 0) {
                let seq = numberSeqData[0].seq;
                seq += 1;
                numberSeqData[0].seq = seq;
                id = numberSeqData[0]._id || null;
                await Numberseq.findOneAndUpdate({ _id: id }, { $set: numberSeqData[0] });

            }
            const numberseqAfterUpdate = await Numberseq.findOne({ _id: id }).lean();
            console.log("NumberseqAfterUpdate", numberseqAfterUpdate);
            return numberseqAfterUpdate;

            // res.status(200).json({ success: true, message: "Numberseq Updated", data: NumberseqAfterUpdate })
        } catch (error) {

            console.log("Error in updateNumberseqWithScreenId", error);
            return { success: false, message: error.message };
        }

    },
}