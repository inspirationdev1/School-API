const mongoose = require("mongoose");

const examtypeSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    examtype_name: {
        type: String,
        required: true,
    },
    examtype_code: {
        type: String,
        required: true,
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
examtypeSchema.index({ school: 1, examtype_code: 1 }, { unique: true });
examtypeSchema.index({ school: 1, examtype_name: 1 }, { unique: true });
module.exports = mongoose.model("Examtype", examtypeSchema)