const mongoose = require("mongoose");

const journalvoucherdetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    accountledger: { type: mongoose.Schema.Types.ObjectId, ref: 'Accountledger', default: null },
    jv_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Journvalvoucher', required: true },
    jv_code: { type: String, default: '' },
    jv_amount: { type: Number, default: 0 },
    amount_type: { type: String, default: '' },
    account_type: { type: String, default: '' },
    remarks: { type: String, default: '' },
    status: { type: String, default: 'valid' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Journalvoucherdetail", journalvoucherdetailSchema)