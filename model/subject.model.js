const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    subject_name: {
        type: String,
        required: true
    },
    subject_code: {
        type: String,
        required: true
    },
    seq: { type: Number, default: 0 },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
subjectSchema.index({ school: 1, subject_code: 1 }, { unique: true });
subjectSchema.index({ school: 1, subject_name: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema)