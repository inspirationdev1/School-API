const mongoose = require("mongoose");

const examinationSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    examNo:{type:Number,  default:0},
    examination_name: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    examination_code: {
        type: String,
        required: true,
        unique: true,      // 👈 unique constraint
        index: true        // 👈 creates index
    },
    status:{type:String, default:'active'},   
    remarks:{type:String,  default:''},
    createdAt:{type:Date, default: new Date()}

})

module.exports = mongoose.model("Examination", examinationSchema)