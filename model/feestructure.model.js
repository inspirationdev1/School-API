const mongoose = require("mongoose");

const feestructureSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    name: { type: String, required: true },
    code: {
        type: String,
        required: true,
    },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    feestype: { type: mongoose.Schema.ObjectId, ref: "Feestype", required: true },
    taxrate: { type: mongoose.Schema.ObjectId, ref: 'Taxrate' },
    tax_percent: {
        type: Number,
        default: 0
    },
    taxtype: {
        type: String,
        default: "inclusive"
    },
    amount: { type: Number, default: 0 },
    createdAt: { type: Date, default: new Date() }
})

// ✅ Compound unique index
feestructureSchema.index({ school: 1, code: 1 }, { unique: true });
feestructureSchema.index({ school: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Feestructure", feestructureSchema)