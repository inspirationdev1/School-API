require("dotenv").config();

const Warehouse = require("../model/warehouse.model");
const Student = require("../model/student.model");
const Exam = require("../model/examination.model");
const Period = require("../model/period.model");
const Attendee = require("../model/attendee.model");

module.exports = {

    getAllWarehouse: async(req,res)=>{
         try {
            const schoolId = req.user.schoolId;
            const allWarehouse= await Warehouse.find({school:schoolId});
            res.status(200).json({success:true, message:"Success in fetching all  Warehouse", data:allWarehouse})
         } catch (error) {
            console.log("Error in getAllWarehouse", error);
            res.status(500).json({success:false, message:"Server Error in Getting All Warehouse. Try later"})
        }

    },
     getWarehouseWithQuery: async (req, res) => {
    
            try {
                const filterQuery = {};
                const schoolId = req.user.schoolId;
                filterQuery['school'] = schoolId;
                if (req.query.hasOwnProperty('search')) {
                    filterQuery['warehouse_name'] = { $regex: req.query.search, $options: 'i' }
                }
    
                
    
                const filteredWarehousees = await Warehouse.find(filterQuery);
                res.status(200).json({ success: true, data: filteredWarehousees })
            } catch (error) {
                console.log("Error in fetching Warehouse with query", error);
                res.status(500).json({ success: false, message: "Error  in fetching Warehouse  with query." })
            }
    
        },
    createWarehouse: (req, res) => {
       const schoolId = req.user.id;
       const newWarehouse = new Warehouse({...req.body,school:schoolId});
       newWarehouse.save().then(savedData => {
           console.log("Date saved", savedData);
           res.status(200).json({ success: true, data: savedData, message:"Warehouse is Created Successfully." })
       }).catch(e => {
           console.log("ERRORO in Register", e)
        //    res.status(500).json({ success: false, message: "Failed Creation of Warehouse." })
        res.status(500).json({ success: false, message: e.message + "-Failed Creation of Warehouse." })
       })

 },
    getWarehouseWithId: async(req, res)=>{
        console.log("ID WAREHOUSE", req.params.id)
        const id = req.params.id;
        Warehouse.findById(id).then(resp=>{
            if(resp){
                res.status(200).json({success:true, data:resp})
            }else {
                res.status(500).json({ success: false, message: "Warehouse data not Available" })
            }
        }).catch(e=>{
            console.log("Error in getWarehouseWithId", e)
            res.status(500).json({ success: false, message: "Error in getting  Warehouse Data" })
        })
    },

    updateWarehouseWithId: async(req, res)=>{
       
        try {
            let id = req.params.id;
            console.log(req.body)
            await Warehouse.findOneAndUpdate({_id:id},{$set:{...req.body}});
            const WarehouseAfterUpdate =await Warehouse.findOne({_id:id});
            res.status(200).json({success:true, message:"Warehouse Updated", data:WarehouseAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateWarehouseWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Warehouse. Try later"})
        }

    },
    deleteWarehouseWithId: async(req, res)=>{
       
        try {
            let id = req.params.id;
            const schoolId = req.user.schoolId;
            const warehouseStudentCount =(await Student.find({student_warehouse:id,school:schoolId})).length;
            const warehouseExamCount =(await Exam.find({warehouse:id,school:schoolId})).length;
            const warehousePeriodCount =(await Period.find({warehouse:id,school:schoolId})).length;
            if((warehouseStudentCount===0) && (warehouseExamCount===0) && (warehousePeriodCount===0)){
                await Warehouse.findOneAndDelete({_id:id,school:schoolId});
                const warehouseAfterDelete = await Warehouse.findOne({_id:id});
                res.status(200).json({success:true, message:"Warehouse Deleted.", data:warehouseAfterDelete})
            }else{
                res.status(500).json({success:false, message:"This warehouse is already in use."})
            }
          
        } catch (error) {
            
            console.log("Error in updateWarehouseWithId", error);
            res.status(500).json({success:false, message:"Server Error in Deleting Warehouse. Try later"})
        }

    },
    createSubTeacher:async(req, res)=>{
        try {
            let id = req.params.id;
            const schoolId = req.user.schoolId;
            const warehouseDetails =await Warehouse.findOne({_id:id,school:schoolId});
            let asignSubTeach = warehouseDetails.asignSubTeach;
            console.log(asignSubTeach)
             asignSubTeach.push({...req.body})
            await Warehouse.findOneAndUpdate({_id:id},{$set:{asignSubTeach}});
            const WarehouseAfterUpdate =await Warehouse.findOne({_id:id});
            res.status(200).json({success:true, message:"New Subject & Teacher Assigned.", data:WarehouseAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateWarehouseWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Warehouse. Try later"})
        }


    },
    updateSubTeacher:async(req, res)=>{
        try {
            let warehouseId = req.params.warehouseId;
            const subTeachId = req.params.subTeachId;
            const warehouseDetails =await Warehouse.findOne({_id:warehouseId});
            let asignSubTeach = warehouseDetails.asignSubTeach;
            asignSubTeach = asignSubTeach.map(item=>{
                if(item._id==subTeachId){
                    // item = {...item, subject:item.subject, teacher:item.teacher}
                    item.subject = req.body.subject;
                    item.teacher = req.body.teacher;
                    console.log(req.body)
                    return item;
                }
                return item
            })
            
            // console.log(asignSubTeach)
            await Warehouse.findOneAndUpdate({_id:warehouseId},{$set:{asignSubTeach}});
            const WarehouseAfterUpdate =await Warehouse.findOne({_id:warehouseId});
            res.status(200).json({success:true, message:"Subject & Teacher Assignment Updated.", data:WarehouseAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateWarehouseWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Warehouse. Try later"})
        }


    },
    deleteSubTeacherWithId:async(req, res)=>{
        try {
            let warehouseId = req.params.warehouseId;
            const subTeachId = req.params.subTeachId;
            const warehouseDetails =await Warehouse.findOne({_id:warehouseId});
            let asignSubTeach = warehouseDetails.asignSubTeach;
            asignSubTeach.forEach((item,i)=>{
                if(item._id==subTeachId){
                    asignSubTeach.splice(i,1)

                }
            })
            
            console.log(asignSubTeach)
            await Warehouse.findOneAndUpdate({_id:warehouseId},{$set:{asignSubTeach}});
            const WarehouseAfterUpdate =await Warehouse.findOne({_id:warehouseId});
            res.status(200).json({success:true, message:"Subject & Teacher Assignment Cancelled.", data:WarehouseAfterUpdate})
        } catch (error) {
            
            console.log("Error in updateWarehouseWithId", error);
            res.status(500).json({success:false, message:"Server Error in Update Warehouse. Try later"})
        }


    },
    getAttendeeTeacher: async(req, res)=>{
        try {
        
        let attendeeWarehouse =await Attendee.find({teacher:req.user.id}).populate("warehouse");
            
           attendeeWarehouse = attendeeWarehouse.map(x=>{
          return {warehouse_code:x?.warehouse?.warehouse_code,warehouse_name: x?.warehouse?.warehouse_name,warehouseId: x?.warehouse?._id}
        })
            res.status(200).json(attendeeWarehouse)
            
        } catch (error) {
            console.log("Error in getting attendee", error);
            res.status(500).json({success:false, message:"Server Error in getting  Attendee. Try later"})
        }
    }
}