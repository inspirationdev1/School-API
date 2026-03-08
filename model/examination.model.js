const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    name:{type:String,  default:''},
    examDate:{type:Date, default: new Date()},
    subject:{type:mongoose.Schema.ObjectId, ref:"Subject"},
    examtype:{type:mongoose.Schema.ObjectId, ref:"Examtype"},
    status:{type:String, default:'active'},   
    class:{type:mongoose.Schema.ObjectId, ref:"Class"},
    remarks:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()}

})

module.exports = mongoose.model("Examination", examinationSchema)