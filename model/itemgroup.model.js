const mongoose = require("mongoose");

const itemgroupSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School" },
  itemgroup_name: {
    type: String,
    required: true,
  },
  itemgroup_code: {
    type: String,
    required: true,
  },
  seq: { type: Number, default: 0 },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Itemgroup",
    default: null,
  },
  level: { type: Number, default: 0 },
  itemtype: { type: String, default: "" },
  status: { type: String, default: "valid" },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
itemgroupSchema.index({ school: 1, itemgroup_code: 1 }, { unique: true });
itemgroupSchema.index({ school: 1, itemgroup_name: 1 }, { unique: true });
module.exports = mongoose.model("Itemgroup", itemgroupSchema);
