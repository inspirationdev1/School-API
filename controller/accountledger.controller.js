require("dotenv").config();

const Accountledger = require("../model/accountledger.model");

module.exports = {

    getAllAccountledgers: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allAccountledger = await Accountledger.find({ school: schoolId }).populate("groupId");
            res.status(200).json({ success: true, message: "Success in fetching all  Accountledger", data: allAccountledger })
        } catch (error) {
            console.log("Error in getAllAccountledger", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Accountledger. Try later" })
        }

    },
    createAccountledger: (req, res) => {
        const schoolId = req.user.schoolId;
        const newAccountledger = new Accountledger({ ...req.body, school: schoolId });
        newAccountledger.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Accountledger is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getAccountledgerWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Accountledger.findOne({ _id: id, school: schoolId }).populate("groupId").then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Accountledger data not Available" })
            }
        }).catch(e => {
            console.log("Error in getAccountledgerWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Accountledger Data" })
        })
    },

    updateAccountledgerWithId: async (req, res) => {
        // Not providing the  schoolId as accountledger Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Accountledger.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const AccountledgerAfterUpdate = await Accountledger.findOne({ _id: id }).populate("groupId");
            res.status(200).json({ success: true, message: "Accountledger Updated", data: AccountledgerAfterUpdate })
        } catch (error) {

            console.log("Error in updateAccountledgerWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Accountledger. Try later" })
        }

    },
    deleteAccountledgerWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Accountledger.findOneAndDelete({ _id: id, school: schoolId });
            const AccountledgerAfterDelete = await Accountledger.findOne({ _id: id }).populate("groupId");
            res.status(200).json({ success: true, message: "Accountledger Deleted.", data: AccountledgerAfterDelete })



        } catch (error) {

            console.log("Error in updateAccountledgerWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Accountledger. Try later" })
        }

    },
    getAccountledgerWithQuery: async (req, res) => {
    
            try {
                const filterQuery = {};
                const schoolId = req.user.schoolId;
                console.log(schoolId, "schoolId")
                filterQuery['school'] = schoolId;
                if (req.query.hasOwnProperty('search')) {
                    filterQuery['accountledger_name'] = { $regex: req.query.search, $options: 'i' }
                }
    
                if (req.query.hasOwnProperty('groupId')) {
                    filterQuery['groupId'] = req.query.groupId
                }
    
                const filteredAccountledgers = await Accountledger.find(filterQuery).populate("groupId");
                res.status(200).json({ success: true, data: filteredAccountledgers })
            } catch (error) {
                console.log("Error in fetching Accountledger with query", error);
                res.status(500).json({ success: false, message: "Error  in fetching Accountledger  with query." })
            }
    
        },
}