require("dotenv").config();
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

const Appsetting = require("../model/appsetting.model");

module.exports = {

    getAllAppsettings: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allAppsetting= await Appsetting.find({school:schoolId}).populate("school");
            res.status(200).json({success:true, message:"Success in fetching all  Appsetting", data:allAppsetting})
         } catch (error) {
            console.log("Error in getAllAppsetting", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Appsetting. Try later"})
        }

    },
    createAppsetting: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newAppsetting = new Appsetting({...req.body, school:schoolId});
                        newAppsetting.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Appsetting is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: e.message })
                        })

    },
    getAppsettingWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Appsetting.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Appsetting data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getAppsettingWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Appsetting Data" })
        })
    },

    // updateAppsettingWithId: async(req, res)=>{
    // // Not providing the  schoolId as appsetting Id will be unique.
    //     try {
    //         let id = req.params.id;
    //         console.log(req.body)
    //         await Appsetting.findOneAndUpdate({_id:id},{$set:{...req.body}});
    //         const AppsettingAfterUpdate =await Appsetting.findOne({_id:id});
    //         res.status(200).json({success:true, message:"Appsetting Updated", data:AppsettingAfterUpdate})
    //     } catch (error) {
            
    //         console.log("Error in updateAppsettingWithId", error);
    //         res.status(500).json({success:false, message:"Server Error in Update Appsetting. Try later"})
    //     }

    // },
    updateAppsettingWithId: async (req, res) => {
        const form = new formidable.IncomingForm();
        form.parse(req, async (err, fields, files) => {
            if (err) return res.status(400).json({ success: false, message: "Error parsing form data." });


            try {
                const { id } = req.params;
                const appsetting = await Appsetting.findById(id);
                if (!appsetting) return res.status(404).json({ success: false, message: "appsetting not found." });

                // Update text fields
                Object.keys(fields).forEach(field => {
                    appsetting[field] = fields[field][0];
                });

                // Handle image upload to Cloudinary
                if (files.image && files.image[0]) {
                    // Optional: Delete old image from Cloudinary if needed
                    if (appsetting.toolbar_image && appsetting.public_id) {
                        await cloudinary.uploader.destroy(appsetting.public_id);
                    }

                    const photo = files.image[0];
                    const result = await cloudinary.uploader.upload(photo.filepath, {
                        folder: "appsettings",
                        public_id: Date.now() + "_" + photo.originalFilename.split(" ").join("_"),
                    });
                    appsetting.toolbar_image = result.secure_url;
                    appsetting.toolbar_public_id = result.public_id;
                }
                await appsetting.save();
                res.status(200).json({ success: true, message: "appsetting updated successfully", data: appsetting });
            } catch (e) {
                console.log("Error updating appsetting:", e);
                res.status(500).json({ success: false, message: "Error updating appsetting details." });
            }
        });
    },
    deleteAppsettingWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
            
                await Appsetting.findOneAndDelete({_id:id,school:schoolId});
                const AppsettingAfterDelete = await Appsetting.findOne({_id:id});
                res.status(200).json({success:true, message:"Appsetting Deleted.", data:AppsettingAfterDelete})
            

          
        } catch (error) {
            
            console.log("Error in updateAppsettingWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Appsetting. Try later"})
        }

    }
}