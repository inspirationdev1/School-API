const mongoose = require("mongoose");

const paymentdetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true },
    expenseCode: { type: String, default: '' },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    expenseAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    status: { type: String, default: 'valid' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Paymentdetail", paymentdetailSchema)