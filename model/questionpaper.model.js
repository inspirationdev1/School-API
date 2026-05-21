const mongoose = require("mongoose");

const questionpaperSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    name:{type:String, required:true},
    description:{type:String, default:''},
    date:{type:Date, default: new Date()},
    class:{type:mongoose.Schema.ObjectId, ref:"Class"},
    section:{type:mongoose.Schema.ObjectId, ref:"Section"},
    teacher:{type:mongoose.Schema.ObjectId, ref:"Teacher"},
    subject:{type:mongoose.Schema.ObjectId, ref:"Subject"},
    examination:{type:mongoose.Schema.ObjectId, ref:"Examination"},
    marksLimit:{type:Number,  default:0},
    grade_markslimit:{type:Number,  default:0},
    fileType:{type:String,  default:''},
    fileName:{type:String,  default:''},
    public_id:{type:String,  default:''},
    docStatus:{type:String, default:'pending'},
    status:{type:String, default:'active'},
    remarks:{type:String, default:''},
    year: { type: Number, default: new Date().getFullYear() },
    createdAt:{type:Date, default: new Date()}
})

module.exports = mongoose.model("Questionpaper", questionpaperSchema)