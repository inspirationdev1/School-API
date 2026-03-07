const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    screen_name:{type:String, required:true},
    screen_code:{type:String,required:true},
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Screen", screenSchema)