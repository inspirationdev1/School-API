const mongoose = require("mongoose");

const expensetypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    expensetype_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    expensetype_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    createdAt:{type:Date, default:new Date()}
})

module.exports = mongoose.model("Expensetype", expensetypeSchema)