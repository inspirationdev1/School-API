const mongoose = require("mongoose");

const accountledgerSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    accountledger_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    accountledger_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
     levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accountlevel', required: true },
    status: { type: String, default: 'valid' },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Accountledger", accountledgerSchema)