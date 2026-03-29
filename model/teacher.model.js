const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{ type: String,  required:true },
    name:{type:String, required:true},
    qualification:{type:String, required:true},
    dOBDate: { type: Date, required: true, },
    age:{type:String, required:true},
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender:{type:String, required:true},
    teacher_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()},
    password:{type:String, required:true}

})

module.exports = mongoose.model("Teacher", teacherSchema)