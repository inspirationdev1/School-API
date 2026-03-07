const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    department_name:{type:String, required:true},
    department_code:{type:String,required:true},
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Department", departmentSchema)