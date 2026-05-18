require("dotenv").config();

const Grade = require("../model/grade.model");

module.exports = {

    getAllGrades: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allGrade= await Grade.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Grade", data:allGrade})
         } catch (error) {
            console.log("Error in getAllGrade", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Grade. Try later"})
        }

    },
    getGradeWithQuery: async (req, res) => {
        
                try {
                    const filterQuery = {};
                    const schoolId = req.user.schoolId;
                    filterQuery['school'] = schoolId;
                    if (req.query.hasOwnProperty('search')) {
                        filterQuery['class_name'] = { $regex: req.query.search, $options: 'i' }
                    }
        
                    
        
                    const filteredGradees = await Grade.find(filterQuery);
                    res.status(200).json({ success: true, data: filteredGradees })
                } catch (error) {
                    console.log("Error in fetching Grade with query", error);
                    res.status(500).json({ success: false, message: "Error  in fetching Grade  with query." })
                }
        
            },
    createGrade: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newGrade = new Grade({...req.body, school:schoolId});
                        newGrade.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Grade is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: e.message })
                        })

    },
    getGradeWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Grade.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Grade data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getGradeWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Grade Data" })
        })
    },

    updateGradeWithId: async(req, res)=>{
    // Not providing the  schoolId as grade Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Grade.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const GradeAfterUpdate =await Grade.findOne({_id:id});
            res.status(200).json({success:true, message:"Grade Updated", data:GradeAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateGradeWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Grade. Try later"})
        }

    },
    deleteGradeWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
                await Grade.findOneAndDelete({_id:id,school:schoolId});
                const GradeAfterDelete = await Grade.findOne({_id:id});
                res.status(200).json({success:true, message:"Grade Deleted.", data:GradeAfterDelete})
           

          
        } catch (error) {
            
            console.log("Error in updateGradeWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Grade. Try later"})
        }

    }
}