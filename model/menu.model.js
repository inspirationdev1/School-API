const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    menu_name:{type:String, required:true},
    menu_code:{type:String,required:true},
    parentId:{type:mongoose.Schema.ObjectId, default:null},
    createdAt:{type:Date, default:new Date()}
})

module.exports = mongoose.model("Menu", menuSchema)