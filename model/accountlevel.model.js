const mongoose = require("mongoose");

const accountlevelSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    accountlevel_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    accountlevel_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    levelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accountlevel', default: null },
    level: { type: Number, default: 0 },
    status: { type: String, default: 'valid' },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Accountlevel", accountlevelSchema)