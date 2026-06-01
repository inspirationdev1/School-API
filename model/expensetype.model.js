const mongoose = require("mongoose");

const expensetypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    expensetype_name: {
        type: String,
        required: true,
    },
    expensetype_code: {
        type: String,
        required: true,
    },
    taxrate:{type:mongoose.Schema.ObjectId, ref:'Taxrate'},
    createdAt:{type:Date, default:new Date()}
})

// ✅ Compound unique index
expensetypeSchema.index({ school: 1, expensetype_code: 1 }, { unique: true });
expensetypeSchema.index({ school: 1, expensetype_name: 1 }, { unique: true });
module.exports = mongoose.model("Expensetype", expensetypeSchema)