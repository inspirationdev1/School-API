require("dotenv").config();

const Department = require("../model/department.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
module.exports = {

    getAllDepartments: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allDepartment= await Department.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Department", data:allDepartment})
         } catch (error) {
            console.log("Error in getAllDepartment", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Department. Try later"})
        }

    },
    createDepartment: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newDepartment = new Department({...req.body, school:schoolId});
                        newDepartment.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Department is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Creation of Department." })
                        })

    },
    getDepartmentWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Department.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Department data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getDepartmentWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Department Data" })
        })
    },

    updateDepartmentWithId: async(req, res)=>{
    // Not providing the  schoolId as department Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Department.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const DepartmentAfterUpdate =await Department.findOne({_id:id});
            res.status(200).json({success:true, message:"Department Updated", data:DepartmentAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateDepartmentWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Department. Try later"})
        }

    },
    deleteDepartmentWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            const subExamCount = (await Exam.find({department:id,school:schoolId})).length;
            const subPeriodCount = (await Period.find({department:id,school:schoolId})).length;
            if((subExamCount===0) && (subPeriodCount===0)){
                await Department.findOneAndDelete({_id:id,school:schoolId});
                const DepartmentAfterDelete = await Department.findOne({_id:id});
                res.status(200).json({success:true, message:"Department Deleted.", data:DepartmentAfterDelete})
            }else{
                res.status(500).json({success:false, message:"This class is already in use."})
            }

          
        } catch (error) {
            
            console.log("Error in updateDepartmentWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Department. Try later"})
        }

    }
}