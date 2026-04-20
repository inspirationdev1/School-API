const mongoose = require("mongoose");

const attendeeSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    createdAt: { type: Date, default: new Date() }
})


// ✅ Compound unique index
attendeeSchema.index(
  { school: 1, class: 1, section: 1, teacher: 1 },
  { unique: true }
);


module.exports = mongoose.model("Attendee", attendeeSchema)