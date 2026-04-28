const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School',required:true},
    department_name: {
        type: String,
        required: true
    },
    department_code: {
        type: String,
        required: true
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
departmentSchema.index({ school: 1, department_code: 1 }, { unique: true });
departmentSchema.index({ school: 1, department_name: 1 }, { unique: true });
module.exports = mongoose.model("Department", departmentSchema)