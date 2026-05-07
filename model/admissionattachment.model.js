const mongoose = require("mongoose");

const admissionattachmentSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    attachmenttype: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Generalmaster",
        default: null,
    },
    attachmentstatus: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Generalmaster",
        default: null,
    },
    attachment_image: { type: String, required: false,default:'' },

    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Admissionattachment", admissionattachmentSchema)