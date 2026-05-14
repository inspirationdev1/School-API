const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    expenseCode: {
        type: String,
        required: true
    },
    expenseNumber: { type: String, default: "" },
    seq: { type: Number, default: 0 },
    expenseDate: { type: Date, required: true, },
    expenseTime: { type: Date, required: true, },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    status: { type: String, default: 'valid' },
    expenseAmount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }
})

// ✅ Compound unique index
expenseSchema.index({ school: 1, expenseCode: 1 }, { unique: true });
module.exports = mongoose.model("Expense", expenseSchema)