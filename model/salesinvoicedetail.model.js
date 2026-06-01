const mongoose = require("mongoose");

const salesinvoicedetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    siId: { type: mongoose.Schema.Types.ObjectId, ref: 'Salesinvoice', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feestructure: { type: mongoose.Schema.Types.ObjectId, ref: 'Feestructure', required: true },
    feestype: { type: mongoose.Schema.ObjectId, ref: "Feestype", required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    itemName: { type: String, default: 'itemname' },
    feeFrequency: { type: String, default: 'monthly' },
    feeAmount: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
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
    month: { type: Number, default: new Date().getMonth() + 1 },
    monthname: { type: String, default: '' },
    taxrate:{type:mongoose.Schema.ObjectId, ref:'Taxrate'},
    taxtype: { type: String, default: '' },
    tax_percent: {
        type: Number,
        default:0
    },
    tax_amount: {
        type: Number,
        default:0
    },
    taxable_amount: {
        type: Number,
        default:0
    },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Salesinvoicedetail", salesinvoicedetailSchema)