const mongoose = require("mongoose");

const accountlevelSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    accountlevel_name: {
        type: String,
        required: true,
    },
    accountlevel_code: {
        type: String,
        required: true,
    },
    seq: { type: Number, default: 0 },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Accountlevel', default: null },
    level: { type: Number, default: 0 },
    status: { type: String, default: 'valid' },
    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
accountlevelSchema.index({ school: 1, accountlevel_code: 1 }, { unique: true });
accountlevelSchema.index({ school: 1, accountlevel_name: 1 }, { unique: true });
module.exports = mongoose.model("Accountlevel", accountlevelSchema)