const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    subject_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    subject_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Subject", subjectSchema)