const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    role_name:{type:String, required:true},
    role_code:{type:String,required:true},
    roleType:{type:String,default:'USER'},
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Role", roleSchema)