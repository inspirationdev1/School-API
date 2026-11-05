const mongoose = require("mongoose");

const openingstockdetailSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
  },
  osId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Openingstock",
    required: true,
    index: true,
  },
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  item_name: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 0.000001 },
  purchase_price: { type: Number, required: true, min: 0 },
  grossAmount: { type: Number, required: true, min: 0 },
  remarks: { type: String, default: "" },
  status: { type: String, enum: ["valid", "cancel"], default: "valid" },
  createdAt: { type: Date, default: Date.now },
});

openingstockdetailSchema.index({ school: 1, osId: 1 });
module.exports = mongoose.model("Openingstockdetail", openingstockdetailSchema);
