const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  name: { type: String, required: true },
  code: {
    type: String,
    required: true,
  },
  itemtype: { type: mongoose.Schema.ObjectId, ref: "Itemtype", required: true },
  itemgroup: {
    type: mongoose.Schema.ObjectId,
    ref: "Itemgroup",
    required: true,
  },
  taxrate: { type: mongoose.Schema.ObjectId, ref: "Taxrate" },
  tax_percent: {
    type: Number,
    default: 0,
  },
  taxtype: {
    type: String,
    default: "inclusive",
  },
  sales_price: { type: Number, default: 0 },
  purchase_price: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
itemSchema.index({ school: 1, code: 1 }, { unique: true });
itemSchema.index({ school: 1, name: 1 }, { unique: true });
module.exports = mongoose.model("Item", itemSchema);
