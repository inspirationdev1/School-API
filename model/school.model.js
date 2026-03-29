const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
    school_name:{type:String, required:true},
    email:{ type: String,  required:true },
    owner_name:{type:String, required:true},
    address:{type:String, required:true},
    city:{type:String, required:true},
    state:{type:String, required:true},
    zipcode:{type:String, required:true},
    country:{type:String, required:true},
    school_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()},
    password:{type:String, required:true}

})

module.exports = mongoose.model("School", schoolSchema)