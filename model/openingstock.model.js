const mongoose = require("mongoose");

const openingstockSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    osCode: { type: String, required: true },
    seq: { type: Number, default: 0 },
    openingStockDate: { type: Date, required: true },
    
    remarks: { type: String, default: "" },
    status: { type: String, enum: ["valid", "cancel"], default: "valid" },
    month: { type: Number, default: () => new Date().getMonth() + 1 },
    monthname: { type: String, default: "" },
    year: { type: Number, default: () => new Date().getFullYear() },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

openingstockSchema.index({ school: 1, osCode: 1 }, { unique: true });
module.exports = mongoose.model("Openingstock", openingstockSchema);
