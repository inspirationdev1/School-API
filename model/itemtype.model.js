const mongoose = require("mongoose");

const itemtypeSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  itemtype_name: {
    type: String,
    required: true,
  },
  itemtype_code: {
    type: String,
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
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
itemtypeSchema.index({ school: 1, itemtype_code: 1 }, { unique: true });
itemtypeSchema.index({ school: 1, itemtype_name: 1 }, { unique: true });
module.exports = mongoose.model("Itemtype", itemtypeSchema);
