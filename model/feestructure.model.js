const mongoose = require("mongoose");

const feestructureSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    name:{type:String, required:true},
    code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
    feestype: { type: mongoose.Schema.ObjectId, ref: "Feestype", required: true },
    amount: { type: Number, default: 0 },
    createdAt:{type:Date, default:new Date()}
})

module.exports = mongoose.model("Feestructure", feestructureSchema)