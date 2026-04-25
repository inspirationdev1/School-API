const mongoose = require("mongoose");

const feestypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    feestype_name: {
        type: String,
        required: true
    },
    feestype_code: {
        type: String,
        required: true
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
feestypeSchema.index({ school: 1, feestype_code: 1 }, { unique: true });
feestypeSchema.index({ school: 1, feestype_name: 1 }, { unique: true });
module.exports = mongoose.model("Feestype", feestypeSchema)