const mongoose = require("mongoose");

const classsubjectdetailSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  csId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classsubject', required: true },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  },
  subject_name: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Classsubjectdetail", classsubjectdetailSchema);
