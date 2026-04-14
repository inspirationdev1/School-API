const mongoose = require("mongoose");

const appsettingSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    appsetting_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    appsetting_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    discPerAllowed: { type: Number, default: 0 },
    createdAt:{type:Date, default:new Date()}

})

module.exports = mongoose.model("Appsetting", appsettingSchema)