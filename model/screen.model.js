const mongoose = require("mongoose");

const screenSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    screen_name:{type:String, required:true},
    screen_code:{type:String,required:true},
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
screenSchema.index({ school: 1, screen_code: 1 }, { unique: true });
screenSchema.index({ school: 1, screen_name: 1 }, { unique: true });
module.exports = mongoose.model("Screen", screenSchema)