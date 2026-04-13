const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    expenseCode: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    expenseNumber: { type: Number, default: 0 },
    expenseDate: { type: Date, required: true, },
    expenseTime: { type: Date, required: true, },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: { type: String, default: 'valid' },
    expenseAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }
})

module.exports = mongoose.model("Expense", expenseSchema)