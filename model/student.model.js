const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School',required:true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    student_code: { type: String, required:true },
    seq: { type: Number, default: 0 },
    student_class: { type: mongoose.Schema.ObjectId, ref: "Class" },
    section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
    parent: { type: mongoose.Schema.ObjectId, ref: "Parent", required: true },
    dOBDate: { type: Date, required: true, },
    age: { type: String, default: null },
    joinDate: { type: Date, required: true, },
    year: { type: Number, default: new Date().getFullYear() },
    gender: { type: String, required: true },
    guardian: { type: String, default: null },
    guardian_phone: { type: String, required: true },
    pen_no: { type: String, default: null },
    aadhar_no: { type: String, default: null },
    admission_no: { type: String, default: null },
    student_image: { type: String, required: true },
    public_id: { type: String,default: ''},
    image: {
        url: String,
        public_id: String,
    },
    createdAt: { type: Date, default: new Date() },
    password: { type: String, required: true }

})

// ✅ Compound unique index
studentSchema.index({ school: 1, student_code: 1 }, { unique: true });
module.exports = mongoose.model("Student", studentSchema)
