require("dotenv").config();

const Menu = require("../model/menu.model");

module.exports = {

    getAllMenu: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allMenu= await Menu.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Menu", data:allMenu})
         } catch (error) {
            console.log("Error in getAllMenu", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Menu. Try later"})
        }

    },
    createMenu: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newMenu = new Menu({...req.body, school:schoolId});
                        newMenu.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Menu is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Creation of Menu." })
                        })

    },
    getMenuWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Menu.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Menu data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getMenuWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Menu Data" })
        })
    },

    updateMenuWithId: async(req, res)=>{
    // Not providing the  schoolId as menu Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Menu.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const MenuAfterUpdate =await Menu.findOne({_id:id});
            res.status(200).json({success:true, message:"Menu Updated", data:MenuAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateMenuWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Menu. Try later"})
        }

    },
    deleteMenuWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
            
                await Menu.findOneAndDelete({_id:id,school:schoolId});
                const MenuAfterDelete = await Menu.findOne({_id:id});
                res.status(200).json({success:true, message:"Menu Deleted.", data:MenuAfterDelete})
            
          
        } catch (error) {
            
            console.log("Error in updateMenuWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Menu. Try later"})
        }

    }
}