const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{ type: String,  required:true },
    employee_name:{type:String, required:true},
    employee_code:{type:String, required:true},
    employee_no:{type:Number, default:0},
    qualification:{type:String, required:true},
    age:{type:String, required:true},
    gender:{type:String, required:true},
    employee_image:{type:String,  required:true},
    createdAt:{type:Date, default: new Date()},

    password:{type:String, required:true}

})

module.exports = mongoose.model("Employee", employeeSchema)