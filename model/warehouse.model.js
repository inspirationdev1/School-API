const mongoose = require("mongoose");

const warehouseSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    warehouse_name: {
      type: String,
      required: true,
      trim: true,
    },

    warehouse_code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    seq: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// =====================================
// COMPOUND UNIQUE INDEXES
// =====================================

// Warehouse code must be unique within each school
warehouseSchema.index({ school: 1, warehouse_code: 1 }, { unique: true });

// Warehouse name must be unique within each school
warehouseSchema.index({ school: 1, warehouse_name: 1 }, { unique: true });

module.exports = mongoose.model("Warehouse", warehouseSchema);
