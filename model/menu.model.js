const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    menu_name:{type:String, required:true},
    menu_code:{type:String,required:true},
    parentId:{type:mongoose.Schema.ObjectId, default:null},
    createdAt:{type:Date, default:new Date()}
})

// ✅ Compound unique index
menuSchema.index({ school: 1, menu_code: 1 }, { unique: true });
menuSchema.index({ school: 1, menu_name: 1 }, { unique: true });
module.exports = mongoose.model("Menu", menuSchema)