const mongoose = require("mongoose");

const expensedetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    expenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    expensetype: { type: mongoose.Schema.Types.ObjectId, ref: 'Expensetype', required: true },
    expensetype_code: { type: String, default: '' },
    expenseAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    status: { type: String, default: 'valid' },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Expensedetail", expensedetailSchema)