const mongoose = require("mongoose");

const castecertificateSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    castecertificate_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    castecertificate_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    docDate: { type: Date, required: true, },
    docTime: { type: Date, required: true, },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    castecategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Generalmaster', required: true },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    status: { type: String, default: 'valid' },

    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Castecertificate", castecertificateSchema)