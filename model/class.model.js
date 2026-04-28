const mongoose = require("mongoose");
const asignSubTeachSchema =new mongoose.Schema({
    subject:{type:mongoose.Schema.ObjectId, ref:'Subject'},
    teacher:{type:mongoose.Schema.ObjectId, ref:"Teacher"}
})
const classSchema = new mongoose.Schema({
    school:{type:mongoose.Schema.ObjectId, ref:'School',required:true},
    class_name: {
        type: String,
        required: true,
    },
    class_code: {
        type: String,
        required: true,
    },
    seq:{type:Number,default:1},
    asignSubTeach:[asignSubTeachSchema],
    attendee:{type:mongoose.Schema.ObjectId, ref:'Teacher', required:false},
    createdAt:{type:Date, default:new Date()}

})

// ✅ Compound unique index
classSchema.index({ school: 1, class_code: 1 }, { unique: true });
classSchema.index({ school: 1, class_name: 1 }, { unique: true });
module.exports = mongoose.model("Class", classSchema)