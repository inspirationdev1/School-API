const Examination = require('../model/examination.model');

module.exports = {
    newExamination: (req, res) => {
        const newExamination = new Examination({
            examination_code: req.body.examination_code,
            examNo: req.body.examNo,
            examination_name: req.body.examination_name,
            marksLimit: req.body.marksLimit,
            school: req.user.id
        })
        newExamination.save().then(resp => {
            res.status(200).send({ success: true, message: "Exam assigned Successfully." })
        }).catch(e => {
            console.log(e)
            res.status(500).send({ success: false, message: e.message })
        })

    },
    getExaminationByClass: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const examination = await Examination.find({ class: req.params.classId, school: schoolId }).populate("subject");
            res.status(200).json({ success: true, message: "Success in fetching User Applications.", data: examination })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in fetching user applications, try later." })
        }
    },
    getAllExaminations: async (req, res) => {
        try {
            const examinations = await Examination.find();
            res.status(200).json({ success: true, message: "Success in fetching User Applications.", data: examinations })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in fetching user applications, try later." })
        }
    },
    getExaminationById: async (req, res) => {
        try {
            const examination = await Examination.findOne({ _id: req.params.id });
            res.status(200).json({ success: true, message: "Success in Fetching Single Examination.", data: examination })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in Fetching Single Examination, try later." })
        }
    },
    deleteExaminationById: async (req, res) => {
        try {
            await Examination.findOneAndDelete({ _id: req.params.id });
            res.status(200).json({ success: true, message: "Success in Deleting Examination." })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in Deleting Examination, try later." })
        }
    },
    updateExaminaitonWithId: async (req, res) => {
        try {
            let id = req.params.id;
            console.log(req.body, id)
            await Examination.findOneAndUpdate({ _id: id }, { $set: { examination_name: req.body.examination_name, examination_code: req.body.examination_code } });
            res.status(200).json({ success: true, message: "Examination Updated." })
        } catch (error) {

            console.log("Error in updateSchoolWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update School. Try later" })
        }

    },
    getExaminationWithQuery: async (req, res) => {
        try {
            const filterQuery = {};
            const schoolId = req.user.schoolId;
            filterQuery['school'] = schoolId;


            if (req.query.hasOwnProperty('search')) {
                filterQuery['examination_name'] = { $regex: req.query.search, $options: 'i' }
            }

            


            const filteredExaminations = await Examination.find(filterQuery);
            res.status(200).json({ success: true, data: filteredExaminations })
        } catch (error) {
            console.log("Error in fetching Employee with query", error);
            res.status(500).json({ success: false, message: "Error  in fetching Examinations  with query." })
        }

    },
}