const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{ type: String,  required:true },
    employee_name:{type:String, required:true},
    employee_code:{type:String, required:true},
    employee_no:{type:Number, default:0},
    qualification:{type:String, required:true},
    dOBDate: { type: Date, required: true, },
    age:{type:String, required:true},
    year: { type: Number, default: new Date().getFullYear() },
    joinDate: { type: Date, required: true, },
    gender:{type:String, required:true},
    employee_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()},

    password:{type:String, required:true}

})

module.exports = mongoose.model("Employee", employeeSchema)