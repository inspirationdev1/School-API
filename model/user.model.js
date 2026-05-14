const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    name:{type:String, required:true},
    user_code:{type:String, required:true},
    seq: { type: Number, default: 0 },
    qualification:{type:String, required:true},
    dOBDate: { type: Date, required: true, },
    age:{type:String, default:null},
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender:{type:String, required:true},
    user_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()},
    password:{type:String, required:true}
})

userSchema.index({ school: 1, user_code: 1 }, { unique: true });
module.exports = mongoose.model("user", userSchema)