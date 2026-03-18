const mongoose = require("mongoose");

const marksheetSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    msCode: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
     name: { type: String, default: '' },
    msNumber: { type: Number, default: 0 },
    msDate: { type: Date, required: true, },
    msTime: { type: Date, required: true, },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    teacher: { type: mongoose.Schema.ObjectId, ref: "Teacher", required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    examination: { type: mongoose.Schema.Types.ObjectId, ref: 'Examination', required: true },
    questionpaper: { type: mongoose.Schema.Types.ObjectId, ref: 'Questionpaper', required: true },
    marksLimit:{type:Number,  default:0},
    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Marksheet", marksheetSchema)