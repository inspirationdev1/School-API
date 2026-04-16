require("dotenv").config();

const Section = require("../model/section.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {

    getAllSections: async (req, res) => {
        try {
            const schoolId = req.user.schoolId;
            const allSection = await Section.find({ school: schoolId });
            res.status(200).json({ success: true, message: "Success in fetching all  Section", data: allSection })
        } catch (error) {
            console.log("Error in getAllSection", error);
            res.status(500).json({ success: false, message: "Server Error in Getting All Section. Try later" })
        }

    },
    createSection: (req, res) => {
        const schoolId = req.user.schoolId;
        const newSection = new Section({ ...req.body, school: schoolId });
        newSection.save().then(savedData => {
            console.log("Date saved", savedData);
            res.status(200).json({ success: true, data: savedData, message: "Section is Created Successfully." })
        }).catch(e => {
            console.log("ERRORO in Register", e)
            res.status(500).json({ success: false, message: e.message })
        })

    },
    // getSectionWithId: async(req, res)=>{
    //     const id = req.params.id;
    //     const schoolId = req.user.schoolId;
    //     Section.findOne({_id:id, school:schoolId}).then(resp=>{
    //         if(resp){
    //             res.status(200).json({success:true, data:resp})
    //         }else {
    //             res.status(500).json({ success: false, message: "Section data not Available" })
    //         }
    //     }).catch(e=>{
    //         console.log("Error in getSectionWithId", e)
    //         res.status(500).json({ success: false, message: "Error in getting  Section Data" })
    //     })
    // },
    getSectionWithId: async (req, res) => {
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        // Class.findById(id).populate("asignSubTeach.subject").populate("asignSubTeach.teacher").populate("attendee").then(resp=>{
        Section.findOne({ _id: id, school: schoolId }).populate("asignSubTeach.subject").populate("asignSubTeach.teacher").populate("attendee").then(resp => {
            if (resp) {
                res.status(200).json({ success: true, data: resp })
            } else {
                res.status(500).json({ success: false, message: "Section data not Available" })
            }
        }).catch(e => {
            console.log("Error in getSectionWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Section Data" })
        })
    },

    updateSectionWithId: async (req, res) => {
        // Not providing the  schoolId as section Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Section.findOneAndUpdate({ _id: id }, { $set: { ...req.body } });
            const SectionAfterUpdate = await Section.findOne({ _id: id });
            res.status(200).json({ success: true, message: "Section Updated", data: SectionAfterUpdate })
        } catch (error) {

            console.log("Error in updateSectionWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Update Section. Try later" })
        }

    },
    deleteSectionWithId: async (req, res) => {

        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            const subExamCount = (await Exam.find({ section: id, school: schoolId })).length;
            const subPeriodCount = (await Period.find({ section: id, school: schoolId })).length;
            if ((subExamCount === 0) && (subPeriodCount === 0)) {
                await Section.findOneAndDelete({ _id: id, school: schoolId });
                const SectionAfterDelete = await Section.findOne({ _id: id });
                res.status(200).json({ success: true, message: "Section Deleted.", data: SectionAfterDelete })
            } else {
                res.status(500).json({ success: false, message: "This class is already in use." })
            }


        } catch (error) {

            console.log("Error in updateSectionWithId", error);
            res.status(500).json({ success: false, message: "Server Error in Deleting Section. Try later" })
        }

    },
    getAttendeeTeacher: async (req, res) => {
        try {
            let attendeeSection = await Section.find({ attendee: req.user.id });
            attendeeSection = attendeeClass.map(x => {
                return { section_code: x.section_code, section_name: x.section_name, sectionId: x._id }
            })
            res.status(200).json(attendeeSection)

        } catch (error) {
            console.log("Error in getting attendee", error);
            res.status(500).json({ success: false, message: "Server Error in getting  Attendee. Try later" })
        }
    },

}