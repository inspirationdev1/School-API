require("dotenv").config();

const Accountlevel = require("../model/accountlevel.model");

module.exports = {

    getAllAccountlevels: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allAccountlevel = await Accountlevel.find({ school: schoolId }).populate("levelId");
            res.status(200).json({ success: true, message: "Success in fetching all  Accountlevel", data: allAccountlevel })
        } catch (error) {
            console.log("Error in getAllAccountlevel", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Accountlevel. Try later" })
        }

    },
    createAccountlevel: (req, res) => {
        const schoolId = req.user.schoolId;
        const newAccountlevel = new Accountlevel({ ...req.body, school: schoolId });
        newAccountlevel.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Accountlevel is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getAccountlevelWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Accountlevel.findOne({ _id: id, school: schoolId }).populate("levelId").then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Accountlevel data not Available" })
            }
        }).catch(e => {
            console.log("Error in getAccountlevelWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Accountlevel Data" })
        })
    },

    updateAccountlevelWithId: async (req, res) => {
        // Not providing the  schoolId as accountlevel Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Accountlevel.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const AccountlevelAfterUpdate = await Accountlevel.findOne({ _id: id }).populate("levelId");
            res.status(200).json({ success: true, message: "Accountlevel Updated", data: AccountlevelAfterUpdate })
        } catch (error) {

            console.log("Error in updateAccountlevelWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Accountlevel. Try later" })
        }

    },
    deleteAccountlevelWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Accountlevel.findOneAndDelete({ _id: id, school: schoolId });
            const AccountlevelAfterDelete = await Accountlevel.findOne({ _id: id }).populate("levelId");
            res.status(200).json({ success: true, message: "Accountlevel Deleted.", data: AccountlevelAfterDelete })



        } catch (error) {

            console.log("Error in updateAccountlevelWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Accountlevel. Try later" })
        }

    }
}