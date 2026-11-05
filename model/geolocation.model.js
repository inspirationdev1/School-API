const mongoose = require("mongoose");

const geolocationSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.ObjectId, ref: "Company" },
  geolocation_name: {
    type: String,
    required: true,
  },
  geolocation_code: {
    type: String,
    required: true,
  },
  seq: { type: Number, default: 0 },
  linkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Geolocation",
    default: null,
  },
  level: { type: Number, default: 0 },
  status: { type: String, default: "valid" },
  createdAt: { type: Date, default: new Date() },
});

// ✅ Compound unique index
geolocationSchema.index({ company: 1, geolocation_code: 1 }, { unique: true });
geolocationSchema.index({ company: 1, geolocation_name: 1 }, { unique: true });
module.exports = mongoose.model("Geolocation", geolocationSchema);
