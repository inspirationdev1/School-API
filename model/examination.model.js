const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    examNo:{type:Number,  default:0},
    examination_name: {
        type: String,
        required: true
    },
    examination_code: {
        type: String,
        required: true
    },
    status:{type:String, default:'active'},   
    remarks:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()}

})

// ✅ Compound unique index
examinationSchema.index({ school: 1, examination_code: 1 }, { unique: true });
examinationSchema.index({ school: 1, examination_name: 1 }, { unique: true });
module.exports = mongoose.model("Examination", examinationSchema)