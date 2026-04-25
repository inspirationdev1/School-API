const mongoose = require("mongoose");

const numberseqSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    numberseq_name:{type:String, required:true},
    screen: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
    prefix:{type:String, default: ''},
    suffix:{type:String, default: ''},
    seq:{type:Number, default:0},
    createdAt:{type:Date, default:new Date()}
})

// ✅ Compound unique index
numberseqSchema.index({ school: 1, screen: 1 }, { unique: true });
module.exports = mongoose.model("Numberseq", numberseqSchema)