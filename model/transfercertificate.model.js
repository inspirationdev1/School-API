const mongoose = require("mongoose");

const transfercertificateSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    transfercertificate_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    transfercertificate_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    docDate: { type: Date, required: true, },
        docTime: { type: Date, required: true, },
        leaveDate: { type: Date, required: true, },
        
        class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
        section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        remarks: { type: String, default: '' },
        year: { type: Number, default: new Date().getFullYear() },
        status: { type: String, default: 'valid' },
    
        createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Transfercertificate", transfercertificateSchema)