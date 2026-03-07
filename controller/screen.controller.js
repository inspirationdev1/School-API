require("dotenv").config();

const Screen = require("../model/screen.model");

module.exports = {

    getAllScreens: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allScreen= await Screen.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Screen", data:allScreen})
         } catch (error) {
            console.log("Error in getAllScreen", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Screen. Try later"})
        }

    },
    createScreen: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newScreen = new Screen({...req.body, school:schoolId});
                        newScreen.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Screen is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Creation of Screen." })
                        })

    },
    getScreenWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Screen.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Screen data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getScreenWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Screen Data" })
        })
    },

    updateScreenWithId: async(req, res)=>{
    // Not providing the  schoolId as screen Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Screen.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const ScreenAfterUpdate =await Screen.findOne({_id:id});
            res.status(200).json({success:true, message:"Screen Updated", data:ScreenAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateScreenWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Screen. Try later"})
        }

    },
    deleteScreenWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
                await Screen.findOneAndDelete({_id:id,school:schoolId});
                const ScreenAfterDelete = await Screen.findOne({_id:id});
                res.status(200).json({success:true, message:"Screen Deleted.", data:ScreenAfterDelete})
            

          
        } catch (error) {
            
            console.log("Error in updateScreenWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Screen. Try later"})
        }

    }
}