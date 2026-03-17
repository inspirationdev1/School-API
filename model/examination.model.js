const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    examCode:{type:String,  default:''},
    examNo:{type:Number,  default:0},
    name:{type:String,  default:''},
    status:{type:String, default:'active'},   
    remarks:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()}

})

module.exports = mongoose.model("Examination", examinationSchema)