const mongoose = require("mongoose");

const questionpaperSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    name:{type:String, required:true},
    description:{type:String, default:''},
    date:{type:Date, default: new Date()},
    class:{type:mongoose.Schema.ObjectId, ref:"Class"},
    teacher:{type:mongoose.Schema.ObjectId, ref:"Teacher"},
    examination:{type:mongoose.Schema.ObjectId, ref:"Examination"},
    examtype:{type:mongoose.Schema.ObjectId, ref:"Examtype"},
    subject:{type:mongoose.Schema.ObjectId, ref:"Subject"},
    fileType:{type:String,  default:''},
    fileName:{type:String,  default:''},
    docStatus:{type:String, default:'pending'},
    status:{type:String, default:'active'},
    remarks:{type:String, default:''},
    createdAt:{type:Date, default: new Date()}
})

module.exports = mongoose.model("Questionpaper", questionpaperSchema)