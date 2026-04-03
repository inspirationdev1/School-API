require("dotenv").config();

const Examtype = require("../model/examtype.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {

    getAllExamtypes: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allExamtype= await Examtype.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Examtype", data:allExamtype})
         } catch (error) {
            console.log("Error in getAllExamtype", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Examtype. Try later"})
        }

    },
    createExamtype: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newExamtype = new Examtype({...req.body, school:schoolId});
                        newExamtype.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Examtype is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: e.message })
                        })

    },
    getExamtypeWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Examtype.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Examtype data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getExamtypeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Examtype Data" })
        })
    },

    updateExamtypeWithId: async(req, res)=>{
    // Not providing the  schoolId as examtype Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Examtype.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const ExamtypeAfterUpdate =await Examtype.findOne({_id:id});
            res.status(200).json({success:true, message:"Examtype Updated", data:ExamtypeAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateExamtypeWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Examtype. Try later"})
        }

    },
    deleteExamtypeWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            const subExamCount = (await Exam.find({examtype:id,school:schoolId})).length;
            const subPeriodCount = (await Period.find({examtype:id,school:schoolId})).length;
            if((subExamCount===0) && (subPeriodCount===0)){
                await Examtype.findOneAndDelete({_id:id,school:schoolId});
                const ExamtypeAfterDelete = await Examtype.findOne({_id:id});
                res.status(200).json({success:true, message:"Examtype Deleted.", data:ExamtypeAfterDelete})
            }else{
                res.status(500).json({success:false, message:"This class is already in use."})
            }

          
        } catch (error) {
            
            console.log("Error in updateExamtypeWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Examtype. Try later"})
        }

    }
}