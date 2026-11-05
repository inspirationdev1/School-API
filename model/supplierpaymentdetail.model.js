const mongoose = require("mongoose");

const supplierpaymentdetailSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplierpayment",
    required: true,
  },
  piId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchaseinvoice",
    required: true,
  },
  piCode: { type: String, default: "" },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  invAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
  status: { type: String, default: "valid" },
  year: { type: Number, default: new Date().getFullYear() },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model(
  "Supplierpaymentdetail",
  supplierpaymentdetailSchema,
);
