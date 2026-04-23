const mongoose = require("mongoose");

const generalmasterSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    generalmaster_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    generalmaster_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
     generalmaster_type: {
        type: String,
        required: true,
    },
   
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Generalmaster", generalmasterSchema)