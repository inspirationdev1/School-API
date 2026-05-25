require("dotenv").config();

const Workingdays = require("../model/workingdays.model");

module.exports = {

    getAllWorkingdays: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allWorkingdays = await Workingdays.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Workingdays", data: allWorkingdays })
        } catch (error) {
            console.log("Error in getAllWorkingdays", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Workingdays. Try later" })
        }

    },
    getWorkingdaysWithQuery: async (req, res) => {

        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;
            // if (req.query.hasOwnProperty('search')) {
            //     filterQuery['year'] = { $regex: req.query.search, $options: 'i' }
            // }

            if (req.query.hasOwnProperty('search')) {
                filterQuery.$or = [
                    { year: { $regex: req.query.search, $options: 'i' } },
                    { month: { $regex: req.query.search, $options: 'i' } },
                    { month_name: { $regex: req.query.search, $options: 'i' } },
                    { work_days: { $regex: req.query.search, $options: 'i' } },
                ];
            }



            const filteredWorkingdayses = await Workingdays.find(filterQuery);
            res.status(200).json({ success: true, data: filteredWorkingdayses })
        } catch (error) {
            console.log("Error in fetching Workingdays with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Workingdays  with query." })
        }

    },
    createWorkingdays: (req, res) => {
        const schoolId = req.user.schoolId;
        const newWorkingdays = new Workingdays({ ...req.body, school: schoolId });
        newWorkingdays.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Workingdays is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getWorkingdaysWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Workingdays.findOne({ _id: id, school: schoolId }).then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Workingdays data not Available" })
            }
        }).catch(e => {
            console.log("Error in getWorkingdaysWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Workingdays Data" })
        })
    },

    updateWorkingdaysWithId: async (req, res) => {
        // Not providing the  schoolId as workingdays Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Workingdays.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const WorkingdaysAfterUpdate = await Workingdays.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Workingdays Updated", data: WorkingdaysAfterUpdate })
        } catch (error) {

            console.log("Error in updateWorkingdaysWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Workingdays. Try later" })
        }

    },
    deleteWorkingdaysWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Workingdays.findOneAndDelete({ _id: id, school: schoolId });
            const WorkingdaysAfterDelete = await Workingdays.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Workingdays Deleted.", data: WorkingdaysAfterDelete })



        } catch (error) {

            console.log("Error in updateWorkingdaysWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Workingdays. Try later" })
        }

    }
}