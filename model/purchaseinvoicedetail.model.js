const mongoose = require("mongoose");

const purchaseinvoicedetailSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  piId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Purchaseinvoice",
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Warehouse",
    required: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  item_name: { type: String, default: "itemname" },
  quantity: { type: Number, default: 1 },
  purchase_price: { type: Number, default: 0 },
  grossAmount: { type: Number, default: 0 },
  discountType: { type: String, default: "none" },
  discountMonth: { type: Number, default: 0 },
  discountPer: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  netAmount: { type: Number, default: 0 },
  remarks: { type: String, default: "" },
  status: { type: String, default: "valid" },
  year: { type: Number, default: new Date().getFullYear() },
  month: { type: Number, default: new Date().getMonth() + 1 },
  monthname: { type: String, default: "" },
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

module.exports = mongoose.model(
  "Purchaseinvoicedetail",
  purchaseinvoicedetailSchema,
);
