require("dotenv").config();

const Classsubjects = require("../model/classsubject.model");

module.exports = {

    getAllClasssubjects: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allClasssubjects = await Classsubjects.find({ school: schoolId }).populate("class").populate("subject");
            res.status(200).json({ success: true, message: "Success in fetching all  Classsubjects", data: allClasssubjects })
        } catch (error) {
            console.log("Error in getAllClasssubjects", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Classsubjects. Try later" })
        }

    },
    getClasssubjectsWithQuery: async (req, res) => {

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



            const filteredClasssubjectses = await Classsubjects.find(filterQuery).populate("class").populate("subject");
            res.status(200).json({ success: true, data: filteredClasssubjectses })
        } catch (error) {
            console.log("Error in fetching Classsubjects with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Classsubjects  with query." })
        }

    },
    createClasssubjects: (req, res) => {
        const schoolId = req.user.schoolId;
        const newClasssubjects = new Classsubjects({ ...req.body, school: schoolId });
        newClasssubjects.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Classsubjects is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    getClasssubjectsWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Classsubjects.findOne({ _id: id, school: schoolId }).populate("class").populate("subject").then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Classsubjects data not Available" })
            }
        }).catch(e => {
            console.log("Error in getClasssubjectsWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Classsubjects Data" })
        })
    },

    updateClasssubjectsWithId: async (req, res) => {
        // Not providing the  schoolId as workingdays Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Classsubjects.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const ClasssubjectsAfterUpdate = await Classsubjects.findOne({ _id: id }).populate("class").populate("subject");
            res.status(200).json({ success: true, message: "Classsubjects Updated", data: ClasssubjectsAfterUpdate })
        } catch (error) {

            console.log("Error in updateClasssubjectsWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Classsubjects. Try later" })
        }

    },
    deleteClasssubjectsWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;

            await Classsubjects.findOneAndDelete({ _id: id, school: schoolId });
            const ClasssubjectsAfterDelete = await Classsubjects.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Classsubjects Deleted.", data: ClasssubjectsAfterDelete })



        } catch (error) {

            console.log("Error in updateClasssubjectsWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Classsubjects. Try later" })
        }

    }
}