const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    grade_name: {
        type: String,
        required: true
    },
    grade_code: {
        type: String,
        required: true
    },
    grade_percentage: {
        type: Number,
        default:0
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
gradeSchema.index({ school: 1, grade_code: 1 }, { unique: true });
gradeSchema.index({ school: 1, grade_name: 1 }, { unique: true });
module.exports = mongoose.model("Grade", gradeSchema)