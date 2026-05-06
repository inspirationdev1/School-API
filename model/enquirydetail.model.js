const mongoose = require("mongoose");

const enquirydetailSchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    enquiry_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', required: true },
    enquiry_date: { type: Date, required: true, },
    enquiry_time: { type: Date, required: true, },
    child_name: { type: String, default: '' },
    child_dob: { type: Date, default: new Date() },
    class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
   previousschool: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Generalmaster",
            required: false,
            default: null,
        },
    previousschool_name: { type: String, default: '' },
    board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Generalmaster",
            required: false,
            default: null,
        },
    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

module.exports = mongoose.model("Enquirydetail", enquirydetailSchema)