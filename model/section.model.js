const mongoose = require("mongoose");
const asignSubTeachSchema =new mongoose.Schema({
    subject:{type:mongoose.Schema.ObjectId, ref:'Subject'},
    teacher:{type:mongoose.Schema.ObjectId, ref:"Teacher"}
})

const sectionSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School'},
    section_name: {
        type: String,
        required: true,
    },
    section_code: {
        type: String,
        required: true,
    },
    asignSubTeach:[asignSubTeachSchema],
    attendee:{type:mongoose.Schema.ObjectId, ref:'Teacher', required:false},
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
sectionSchema.index({ school: 1, section_code: 1 }, { unique: true });
sectionSchema.index({ school: 1, section_name: 1 }, { unique: true });
module.exports = mongoose.model("Section", sectionSchema)