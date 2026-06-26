const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  receiptCode: {
    type: String,
    required: true,
  },
  receiptNumber: { type: String, default: 0 },
  seq: { type: Number, default: 0 },
  receiptDate: { type: Date, required: true },
  receiptTime: { type: Date, required: true },
  paymentMethod: { type: String, default: "cash", required: true },
  status: { type: String, default: "valid" },
  remarks: { type: String, default: "" },
  year: { type: Number, default: new Date().getFullYear() },
  month: { type: Number, default: new Date().getMonth() + 1 },
  academicyear: { type: String, default: "" },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
receiptSchema.index({ school: 1, receiptCode: 1 }, { unique: true });
module.exports = mongoose.model("Receipt", receiptSchema);
