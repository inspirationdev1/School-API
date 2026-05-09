const mongoose = require("mongoose");

const appsettingSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    appsetting_name: {
        type: String,
        required: true,
    },
    appsetting_code: {
        type: String,
        required: true,
    },
    udise_no: { type: String, default: null },
    discPerAllowed: { type: Number, default: 0 },
    report_image: {
        type: String,
        required: false,
        default: null,
    },
    toolbar_image: {
        type: String,
        required: false,
        default: null,
    },
    toolbar_public_id: {
        type: String,
        required: false,
        default: null,
    },
    
    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
appsettingSchema.index({ school: 1, appsetting_code: 1 }, { unique: true });
appsettingSchema.index({ school: 1, appsetting_name: 1 }, { unique: true });
module.exports = mongoose.model("Appsetting", appsettingSchema)