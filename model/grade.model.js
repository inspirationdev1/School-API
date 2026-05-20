const mongoose = require("mongoose");

const gradeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    grade_code: {
        type: String,
        required: true
    },
    marks_limit: {
        type: Number,
        default:0
    },
   
    marks_max: {
        type: Number,
        default:0
    },
     marks_min: {
        type: Number,
        default:0
    },
    gpa: {
        type: String,
        default:''
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
gradeSchema.index({ school: 1, grade_code: 1,marks_limit: 1 }, { unique: true });
module.exports = mongoose.model("Grade", gradeSchema)