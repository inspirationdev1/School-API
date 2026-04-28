const mongoose = require("mongoose");

const parentSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School',required:true},
    email:{ type: String,  required:true },
    name:{type:String, required:true},
    parent_code:{type:String, required:true},
    seq: { type: Number, default: 0 },
    qualification:{type:String, default:null},
    dOBDate: { type: Date, required: true, },
    age:{type:String, default:null},
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender:{type:String, required:true},
    parent_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    phoneno:{type:String, default:null},
    createdAt:{type:Date, default: new Date()},

    password:{type:String, required:true}

})

// ✅ Compound unique index
parentSchema.index({ school: 1, parent_code: 1 }, { unique: true });
module.exports = mongoose.model("Parent", parentSchema)