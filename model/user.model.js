const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{ type: String,  required:true },
    name:{type:String, required:true},
    qualification:{type:String, required:true},
    dOBDate: { type: Date, required: true, },
    age:{type:String, required:true},
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender:{type:String, required:true},
    user_image:{type:String,  required:true},
    createdAt:{type:Date, default: new Date()},

    password:{type:String, required:true}

})

module.exports = mongoose.model("user", userSchema)