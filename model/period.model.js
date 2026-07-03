// models/Period.js
const mongoose = require("mongoose");

const periodSchema = new mongoose.Schema(
  {
    school: { type: mongoose.Schema.ObjectId, ref: "School" },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    period_code: { type: String, required: true },
    period_name: { type: String, required: true },
    starttime: { type: String, required: true },
    endtime: { type: String, required: true },
    startminutes: { type: Number, default: 1 },
    endminutes: { type: Number, default: 1 },
    timeseq: { type: Number, default: 1 },
    subjectkey: { type: String, default: "" },
    days: [],
  },
  { timestamps: true },
);

// ✅ Compound unique index
periodSchema.index({ school: 1, period_code: 1 }, { unique: true });
// periodSchema.index({ school: 1, period_name: 1 }, { unique: true });

module.exports = mongoose.model("Period", periodSchema);
