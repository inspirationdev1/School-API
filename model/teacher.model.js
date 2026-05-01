const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    email:{ type: String,  required:true },
    name:{type:String, required:true},
    // teacher_code:{type:String, required:true},
    teacher_code: {
        type: String,
        required: true,
    },
    seq: { type: Number, default: 0 },
    qualification:{type:String, required:true},
    dOBDate: { type: Date, required: true, },
    age:{type:String, default:null},
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender:{type:String, required:true},
    teacher_image:{type:String,  required:true},
    public_id:{type:String,  default:''},
    phoneno:{type:String,  default:null},
    createdAt:{type:Date, default: new Date()},
    password:{type:String, required:true}

})

// ✅ Compound unique index
teacherSchema.index({ school: 1, teacher_code: 1 }, { unique: true });
module.exports = mongoose.model("Teacher", teacherSchema)