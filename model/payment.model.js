const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    paymentCode: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    paymentNumber: { type: Number, default: 0 },
    paymentDate: { type: Date, required: true, },
    paymentTime: { type: Date, required: true, },
    paymentMethod: { type: String, default: 'cash', required: true },
    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Payment", paymentSchema)