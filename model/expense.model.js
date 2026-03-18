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
    paymentMethod: { type: String, default: 'cash', required: true },
    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }
})

module.exports = mongoose.model("Expense", expenseSchema)