require("dotenv").config();

const Taxrate = require("../model/taxrate.model");

module.exports = {

    getAllTaxrates: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allTaxrate= await Taxrate.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Taxrate", data:allTaxrate})
         } catch (error) {
            console.log("Error in getAllTaxrate", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Taxrate. Try later"})
        }

    },
    getTaxrateWithQuery: async (req, res) => {
        
                try {
                    const filterQuery = {};
                    const schoolId = req.user.schoolId;
                    filterQuery['school'] = schoolId;
                    if (req.query.hasOwnProperty('search')) {
                        filterQuery['tax_code'] = { $regex: req.query.search, $options: 'i' }
                    }
        
                    
        
                    const filteredTaxratees = await Taxrate.find(filterQuery);
                    res.status(200).json({ success: true, data: filteredTaxratees })
                } catch (error) {
                    console.log("Error in fetching Taxrate with query", error);
                    res.status(500).json({ success: false, message: "Error  in fetching Taxrate  with query." })
                }
        
            },
    createTaxrate: (req, res) => {
                        const schoolId = req.user.schoolId;
                        const newTaxrate = new Taxrate({...req.body, school:schoolId});
                        newTaxrate.save().then(savedData => {
                            console.log("Date saved", savedData);
                            res.status(200).json({ success: true, data: savedData, message:"Taxrate is Created Successfully." })
                        }).catch(e => {
                            console.log("ERRORO in Register", e)
                            res.status(500).json({ success: false, message: e.message })
                        })

    },
    getTaxrateWithId: async(req, res)=>{
        const id = req.params.id;
        const schoolId = req.user.schoolId;
        Taxrate.findOne({_id:id, school:schoolId}).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Taxrate data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getTaxrateWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Taxrate Data" })
        })
    },

    updateTaxrateWithId: async(req, res)=>{
    // Not providing the  schoolId as taxrate Id will be unique.
        try {
            let id = req.params.id;
            console.log(req.body)
            await Taxrate.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const TaxrateAfterUpdate =await Taxrate.findOne({_id:id});
            res.status(200).json({success:true, message:"Taxrate Updated", data:TaxrateAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateTaxrateWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Taxrate. Try later"})
        }

    },
    deleteTaxrateWithId: async(req, res)=>{
       
        try {
            const schoolId = req.user.schoolId;
            let id = req.params.id;
            
                await Taxrate.findOneAndDelete({_id:id,school:schoolId});
                const TaxrateAfterDelete = await Taxrate.findOne({_id:id});
                res.status(200).json({success:true, message:"Taxrate Deleted.", data:TaxrateAfterDelete})
           

          
        } catch (error) {
            
            console.log("Error in updateTaxrateWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Taxrate. Try later"})
        }

    }
}