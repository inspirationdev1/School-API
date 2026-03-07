const mongoose = require("mongoose");

const feestypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    feestype_name:{type:String, required:true},
    feestype_codename:{type:String,required:true},
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Feestype", feestypeSchema)