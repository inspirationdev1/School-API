const mongoose = require("mongoose");

const workingdaysSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    
    year: {
        type: Number,
        default:0
    },
    month: {
        type: Number,
        default:0
    },
    month_name: {
        type: String,
        default:''
    },
     work_days: {
        type: Number,
        default:0
    },
    seq: {
        type: Number,
        default:0
    },
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
workingdaysSchema.index({ school: 1, month: 1,year: 1 }, { unique: true });
module.exports = mongoose.model("Workingdays", workingdaysSchema)