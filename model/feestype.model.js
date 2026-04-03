const mongoose = require("mongoose");

const feestypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    feestype_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    feestype_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Feestype", feestypeSchema)