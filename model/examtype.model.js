const mongoose = require("mongoose");

const examtypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    examtype_name:{type:String, required:true},
    examtype_code:{type:String,required:true},
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Examtype", examtypeSchema)