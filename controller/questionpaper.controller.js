const Questionpaper = require('../model/questionpaper.model');

module.exports = {
    newQuestionpaper: (req, res) => {
        const newQuestionpaper = new Questionpaper({
            name: req.body.name,
            description: req.body.description,
            date: req.body.date,
            subject: req.body.subject,
            teacher: req.body.teacher,
            examination: req.body.examination,
            examtype: req.body.examtype,
            class: req.body.class_id,
            school: req.user.id
        })
        newQuestionpaper.save().then(resp => {
            res.status(200).send({ success: true, message: "Questionpaper Added Successfully." })
        }).catch(e => {
            console.log(e)
            res.status(500).send({ success: false, message: "Failure  in Questionpaper , try later." })
        })

    },
    getQuestionpaperByClass: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const questionpaper = await Questionpaper.find({ class: req.params.classId, school: schoolId }).populate("subject").populate("teacher").populate("subject").populate("examination");
            res.status(200).json({ success: true, message: "Success in fetching User Applications.", data: questionpaper })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in fetching user applications, try later." })
        }
    },
    getAllQuestionpapers: async (req, res) => {
        try {
            const questionpapers = await Questionpaper.find().populate("subject").populate("class").populate("teacher").populate("subject").populate("examination");
            res.status(200).json({ success: true, message: "Success in fetching User Applications.", data: questionpapers })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in fetching user applications, try later." })
        }
    },
    getQuestionpaperById: async (req, res) => {
        try {
            const questionpaper = await Questionpaper.findOne({ _id: req.params.id });
            res.status(200).json({ success: true, message: "Success in Fetching Single Questionpaper.", data: questionpaper })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in Fetching Single Questionpaper, try later." })
        }
    },
    deleteQuestionpaperById: async (req, res) => {
        try {
            await Questionpaper.findOneAndDelete({ _id: req.params.id });
            res.status(200).json({ success: true, message: "Success in Deleting Questionpaper." })
        } catch (error) {
            res.status(500).send({ success: false, message: "Failure  in Deleting Questionpaper, try later." })
        }
    },
    updateQuestionpaperWithId: async (req, res) => {
        try {
            let id = req.params.id;
            console.log(req.body, id)
            await Questionpaper.findOneAndUpdate({ _id: id }, { $set: { name: req.body.name,description: req.body.description
                ,date: req.body.date, teacher: req.body.teacher
                , subject: req.body.subject, examination: req.body.examination, examtype: req.body.examtype } });
            // const questionpaperAfterUpdate =await School.findOne({_id:id});
            res.status(200).json({ success: true, message: "Questionpaper Updated." })
        } catch (error) {

            console.log("Error in updateSchoolWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update School. Try later" })
        }

    },
}