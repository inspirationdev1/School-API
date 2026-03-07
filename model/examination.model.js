const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    examDate:{type:String,  required:true},
    subject:{type:mongoose.Schema.ObjectId, ref:"Subject"},
    examtype:{type:mongoose.Schema.ObjectId, ref:"Examtype"},
    status:{type:String, default:'pending'},   
    class:{type:mongoose.Schema.ObjectId, ref:"Class"},
    createdAt:{type:Date, default: new Date()}

})

module.exports = mongoose.model("Examination", examinationSchema)