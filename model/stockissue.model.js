const mongoose = require("mongoose");

const stockissueSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    siCode: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    employee_name: {
      type: String,
      default: "",
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    warehouse_name: {
      type: String,
      default: "",
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
    month: {
      type: Number,
      default: () => new Date().getMonth() + 1,
    },
    monthname: {
      type: String,
      default: "",
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false },
);

stockissueSchema.index({ school: 1, siCode: 1 }, { unique: true });

module.exports = mongoose.model("Stockissue", stockissueSchema);
