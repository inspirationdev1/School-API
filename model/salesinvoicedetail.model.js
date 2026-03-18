const mongoose = require("mongoose");

const salesinvoicedetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    siId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesinvoice', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feestructure: { type: mongoose.Schema.Types.ObjectId, ref: 'Feestructure', required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemName: { type: String, default: 'itemname' },
    feeFrequency: { type: String, default: 'monthly' },
    feeAmount: { type: Number, default: 0 },
    Quantity: { type: Number, default: 0 },
    salesPrice: { type: Number, default: 0 },
    grossAmount: { type: Number, default: 0 },
    discountType: { type: String, default: 'none' },
    discountMonth: { type: Number, default: 0 },
    discountPer: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    netAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    status: { type: String, default: 'valid' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Salesinvoicedetail", salesinvoicedetailSchema)