const mongoose = require("mongoose");

const stockissuedetailSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
  },
  siId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stockissue",
    required: true,
    index: true,
  },
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
    required: true,
  },
  item_name: {
    type: String,
    default: "",
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.000001,
  },
  purchase_price: {
    type: Number,
    default: 0,
    min: 0,
  },
  grossAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  remarks: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["valid", "cancel"],
    default: "valid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

stockissuedetailSchema.index({ school: 1, siId: 1 });

module.exports = mongoose.model("Stockissuedetail", stockissuedetailSchema);
