const mongoose = require("mongoose");

const bonafidecertificateSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    bonafidecertificate_name: {
        type: String,
        required: true,
    },
    bonafidecertificate_code: {
        type: String,
        required: true,
    },
    docDate: { type: Date, required: true, },
    docTime: { type: Date, required: true, },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    status: { type: String, default: 'valid' },

    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
bonafidecertificateSchema.index({ school: 1, bonafidecertificate_code: 1 }, { unique: true });
module.exports = mongoose.model("Bonafidecertificate", bonafidecertificateSchema)