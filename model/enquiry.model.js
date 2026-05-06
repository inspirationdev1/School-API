const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema({
    school: { type: mongoose.Schema.ObjectId, ref: 'School' },
    enquiry_code: {
        type: String,
        required: true
    },
    enquiry_name: { type: String, default: '' },
    enquiry_number: { type: Number, default: 0 },
    enquiry_date: { type: Date, required: true, },
    enquiry_time: { type: Date, required: true, },

    father_name: { type: String, default: '' },
    father_occupation: { type: String, default: '' },
    father_phoneno: { type: String, default: '' },
    father_email: { type: String, default: '' },

    mother_name: { type: String, default: '' },
    mother_occupation: { type: String, default: '' },
    mother_phoneno: { type: String, default: '' },
    mother_email: { type: String, default: '' },

    address: { type: String, default: '' },


    status: { type: String, default: 'valid' },
    remarks: { type: String, default: '' },
    year: { type: Number, default: new Date().getFullYear() },
    createdAt: { type: Date, default: new Date() }

})

// ✅ Compound unique index
enquirySchema.index({ school: 1, enquiry_code: 1 }, { unique: true });
module.exports = mongoose.model("Enquiry", enquirySchema)