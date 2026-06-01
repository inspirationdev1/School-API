const mongoose = require("mongoose");

const taxrateSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    tax_code: {
        type: String,
        required: true
    },
    tax_name: {
        type: String,
        required: true
    },
    tax_percent: {
        type: Number,
        default:0
    },
    taxtype: {
        type: String,
        required: true
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
taxrateSchema.index({ school: 1, tax_code: 1 }, { unique: true });
module.exports = mongoose.model("Taxrate", taxrateSchema)