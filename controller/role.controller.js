require("dotenv").config();

const Role = require("../model/role.model");

module.exports = {

    getAllRoles: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allRole= await Role.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Role", data:allRole})
         } catch (error) {
            console.log("Error in getAllRole", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Role. Try later"})
        }

    },
    createRole: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newRole = new Role({...req.body, school:schoolId});
                        newRole.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Role is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: "Failed Creation of Role." })
                        })

    },
    getRoleWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Role.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Role data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getRoleWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Role Data" })
        })
    },

    updateRoleWithId: async(req, res)=>{
    // Not providing the  schoolId as role Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Role.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const RoleAfterUpdate =await Role.findOne({_id:id});
            res.status(200).json({success:true, message:"Role Updated", data:RoleAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateRoleWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Role. Try later"})
        }

    },
    deleteRoleWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
                await Role.findOneAndDelete({_id:id,school:schoolId});
                const RoleAfterDelete = await Role.findOne({_id:id});
                res.status(200).json({success:true, message:"Role Deleted.", data:RoleAfterDelete})
            

          
        } catch (error) {
            
            console.log("Error in updateRoleWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Role. Try later"})
        }

    }
}