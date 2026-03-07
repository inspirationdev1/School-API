require("dotenv").config();

const Feestype = require("../model/feestype.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {

    getAllFeestypes: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allFeestype= await Feestype.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Feestype", data:allFeestype})
         } catch (error) {
            console.log("Error in getAllFeestype", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Feestype. Try later"})
        }

    },
    createFeestype: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newFeestype = new Feestype({...req.body, school:schoolId});
                        newFeestype.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Feestype is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Creation of Feestype." })
                        })

    },
    getFeestypeWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Feestype.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Feestype data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getFeestypeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Feestype Data" })
        })
    },

    updateFeestypeWithId: async(req, res)=>{
    // Not providing the  schoolId as feestype Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Feestype.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const FeestypeAfterUpdate =await Feestype.findOne({_id:id});
            res.status(200).json({success:true, message:"Feestype Updated", data:FeestypeAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateFeestypeWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Feestype. Try later"})
        }

    },
    deleteFeestypeWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            const subExamCount = (await Exam.find({feestype:id,school:schoolId})).length;
            const subPeriodCount = (await Period.find({feestype:id,school:schoolId})).length;
            if((subExamCount===0) && (subPeriodCount===0)){
                await Feestype.findOneAndDelete({_id:id,school:schoolId});
                const FeestypeAfterDelete = await Feestype.findOne({_id:id});
                res.status(200).json({success:true, message:"Feestype Deleted.", data:FeestypeAfterDelete})
            }else{
                res.status(500).json({success:false, message:"This class is already in use."})
            }

          
        } catch (error) {
            
            console.log("Error in updateFeestypeWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Feestype. Try later"})
        }

    }
}