require("dotenv").config();

const Generalmaster = require("../model/generalmaster.model");

module.exports = {

    getAllGeneralmasters: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allGeneralmaster= await Generalmaster.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Generalmaster", data:allGeneralmaster})
         } catch (error) {
            console.log("Error in getAllGeneralmaster", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Generalmaster. Try later"})
        }

    },
    createGeneralmaster: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newGeneralmaster = new Generalmaster({...req.body, school:schoolId});
                        newGeneralmaster.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Generalmaster is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: e.message })
                        })

    },
    getGeneralmasterWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Generalmaster.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Generalmaster data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getGeneralmasterWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Generalmaster Data" })
        })
    },

    updateGeneralmasterWithId: async(req, res)=>{
    // Not providing the  schoolId as generalmaster Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Generalmaster.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const GeneralmasterAfterUpdate =await Generalmaster.findOne({_id:id});
            res.status(200).json({success:true, message:"Generalmaster Updated", data:GeneralmasterAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateGeneralmasterWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Generalmaster. Try later"})
        }

    },
    deleteGeneralmasterWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
                await Generalmaster.findOneAndDelete({_id:id,school:schoolId});
                const GeneralmasterAfterDelete = await Generalmaster.findOne({_id:id});
                res.status(200).json({success:true, message:"Generalmaster Deleted.", data:GeneralmasterAfterDelete})
            

          
        } catch (error) {
            
            console.log("Error in updateGeneralmasterWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Generalmaster. Try later"})
        }

    }
}