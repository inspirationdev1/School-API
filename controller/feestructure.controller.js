require("dotenv").config();

const Feestructure = require("../model/feestructure.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {

    getAllFeestructures: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allFeestructure= await Feestructure.find({school:schoolId}).populate('class').populate('feestype');
            res.status(200).json({success:true, message:"Success in fetching all  Feestructure", data:allFeestructure})
         } catch (error) {
            console.log("Error in getAllFeestructure", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Feestructure. Try later"})
        }

    },
    createFeestructure: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newFeestructure = new Feestructure({...req.body, school:schoolId});
                        newFeestructure.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Feestructure is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Creation of Feestructure." })
                        })

    },
    getFeestructureWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Feestructure.findOne({_id:id, school:schoolId}).populate('class').populate('feestype').then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Feestructure data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getFeestructureWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Feestructure Data" })
        })
    },
    getFeestructureWithQuery: async(req, res)=>{
        // const classId = req.params.student_class||"";
        // const schoolId = req.user.schoolId;

        const filterQuery = {};
            const schoolId = req.user.schoolId;
            console.log(schoolId,"schoolId")
            filterQuery['school'] = schoolId;
            
            
            if(req.query.hasOwnProperty('class')){
                filterQuery['class'] = req.query.class
            }
        
        Feestructure.find(filterQuery).populate('class').populate('feestype').then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Feestructure data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getFeestructureWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Feestructure Data" })
        })
    },
    

    updateFeestructureWithId: async(req, res)=>{
    // Not providing the  schoolId as feestructure Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Feestructure.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const FeestructureAfterUpdate =await Feestructure.findOne({_id:id}).populate('class').populate('feestype');
            res.status(200).json({success:true, message:"Feestructure Updated", data:FeestructureAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateFeestructureWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Feestructure. Try later"})
        }

    },
    deleteFeestructureWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            const subExamCount = (await Exam.find({feestructure:id,school:schoolId})).length;
            const subPeriodCount = (await Period.find({feestructure:id,school:schoolId})).length;
            if((subExamCount===0) && (subPeriodCount===0)){
                await Feestructure.findOneAndDelete({_id:id,school:schoolId});
                const FeestructureAfterDelete = await Feestructure.findOne({_id:id});
                res.status(200).json({success:true, message:"Feestructure Deleted.", data:FeestructureAfterDelete})
            }else{
                res.status(500).json({success:false, message:"This class is already in use."})
            }

          
        } catch (error) {
            
            console.log("Error in updateFeestructureWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Feestructure. Try later"})
        }

    }
}