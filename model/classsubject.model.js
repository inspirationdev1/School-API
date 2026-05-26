const mongoose = require("mongoose");

const classsubjectSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    subject_name: { type: String, default: '' },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    class_name: { type: String, default: '' },
    seq: { type: Number, default: 0 },
    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
classsubjectSchema.index({ school: 1, subject: 1, class: 1 }, { unique: true });
module.exports = mongoose.model("Classsubject", classsubjectSchema)