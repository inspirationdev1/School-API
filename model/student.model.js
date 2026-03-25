const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{type:String, required:true},
    name:{type:String, required:true},
    student_class:{type:mongoose.Schema.ObjectId, ref:"Class"},
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    parent: { type: mongoose.Schema.ObjectId, ref: "Parent", required: true },
    dOBDate: { type: Date, required: true, },
    age:{type:String, required:true},
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender:{type:String, required:true},
    guardian:{type:String, required:true},
    guardian_phone:{type:String, required:true},
    student_image:{type:String,  required:true},
    createdAt:{type:Date, default: new Date()},

    password:{type:String, required:true}

})

module.exports = mongoose.model("Student", studentSchema)
