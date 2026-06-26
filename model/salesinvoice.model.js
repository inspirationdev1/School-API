const mongoose = require("mongoose");

const salesinvoiceSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  siCode: {
    type: String,
    required: true,
  },
  siNumber: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  invoiceDate: { type: Date, required: true },
  invoiceTime: { type: Date, required: true },
  class: { type: mongoose.Schema.ObjectId, ref: "Class", required: true },
  section: { type: mongoose.Schema.ObjectId, ref: "Section", required: true },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  paymentStatus: { type: String, default: "pending" },
  status: { type: String, default: "valid" },
  student_name: { type: String, default: "" },
  remarks: { type: String, default: "" },
  month: { type: Number, default: new Date().getMonth() + 1 },
  monthname: { type: String, default: "" },
  year: { type: Number, default: new Date().getFullYear() },
  acctrans: [],
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
salesinvoiceSchema.index({ school: 1, siCode: 1 }, { unique: true });
module.exports = mongoose.model("Salesinvoice", salesinvoiceSchema);
