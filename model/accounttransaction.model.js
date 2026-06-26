const mongoose = require("mongoose");

const accounttransactionSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  doc_code: {
    type: String,
    default: "",
  },
  doc_name: {
    type: String,
    default: "",
  },
  doc_date: { type: Date, default: new Date() },
  doc_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  amount: { type: Number, default: 0 },
  amount_type: { type: String, default: "" },
  mapping_type: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  account_type: { type: String, default: "" },
  accountledger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Accountledger",
    default: null,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    default: null,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    default: null,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    default: null,
  },
  status: { type: String, default: "valid" },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
// accounttransactionSchema.index({ school: 1, accounttransaction_code: 1 }, { unique: true });
// accounttransactionSchema.index({ school: 1, accounttransaction_name: 1 }, { unique: true });
module.exports = mongoose.model("Accounttransaction", accounttransactionSchema);
