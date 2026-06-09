const mongoose = require("mongoose");

const journalvoucherSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    jv_code: {
        type: String,
        required: true
    },
    jv_number: { type: String, default: "" },
    seq: { type: Number, default: 0 },
    jv_date: { type: Date, required: true, },
    jv_time: { type: Date, required: true, },
    status: { type: String, default: 'valid' },
    dr_amount: { type: Number, default: 0 },
    cr_amount: { type: Number, default: 0 },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }
})

// ✅ Compound unique index
journalvoucherSchema.index({ school: 1, jv_code: 1 }, { unique: true });
module.exports = mongoose.model("Journalvoucher", journalvoucherSchema)