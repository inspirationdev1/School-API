const mongoose = require("mongoose");

const expensedetailSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    required: true,
  },
  expensetype: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expensetype",
    required: true,
  },
  expensetype_code: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  expensePrice: { type: Number, default: 0 },
  expenseAmount: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
  status: { type: String, default: "valid" },
  year: { type: Number, default: new Date().getFullYear() },
  taxrate: { type: mongoose.Schema.ObjectId, ref: "Taxrate" },
  taxtype: { type: String, default: "" },
  tax_percent: {
    type: Number,
    default: 0,
  },
  tax_amount: {
    type: Number,
    default: 0,
  },
  taxable_amount: {
    type: Number,
    default: 0,
  },
  createdAt: { type: Date, default: new Date() },
});

module.exports = mongoose.model("Expensedetail", expensedetailSchema);
