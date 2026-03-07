const mongoose = require("mongoose");

const receiptdetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt', required: true },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    siId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesinvoice', required: true },
    siCode: { type: String, default: '' },
    invAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    status: { type: String, default: 'valid' },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Receiptdetail", receiptdetailSchema)