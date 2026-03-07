const mongoose = require("mongoose");

const salesinvoiceSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    siCode: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    
siNumber: { type: Number, default: 0 },
    siNumber: { type: Number, default: 0 },
    invoiceDate: { type: Date, required: true, },
    invoiceTime: { type: Date, required: true, },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    paymentStatus: { type: String, default: 'pending' },
    paymentMethod: { type: String, default: 'cash', required: true },
    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Salesinvoice", salesinvoiceSchema)