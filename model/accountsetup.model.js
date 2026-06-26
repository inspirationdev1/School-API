const mongoose = require("mongoose");

const accountsetupSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  screen: { type: String, required: true },
  screen_name: { type: String, required: true },
  accountledger: { type: mongoose.Schema.ObjectId, ref: "Accountledger" },
  accountledger_name: { type: String, required: true },
  amount_type: { type: String, required: true },
  account_type: { type: String, default: "" },
  mapping_type: { type: String, default: "" },
  seq: { type: Number, default: 0 },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
// accountsetupSchema.index({ school: 1, screen: 1 }, { unique: true });
module.exports = mongoose.model("Accountsetup", accountsetupSchema);
