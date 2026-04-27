const mongoose = require("mongoose");

const accountledgerSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    accountledger_name: {
        type: String,
        required: true,
    },
    accountledger_code: {
        type: String,
        required: true,
    },
     groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accountlevel', required: true },
     seq: { type: Number, default: 0 },
     level: { type: Number, default: 0 },
    status: { type: String, default: 'valid' },
    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
accountledgerSchema.index({ school: 1, accountledger_code: 1 }, { unique: true });
accountledgerSchema.index({ school: 1, accountledger_name: 1 }, { unique: true });
module.exports = mongoose.model("Accountledger", accountledgerSchema)