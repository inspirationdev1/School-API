const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  school: { type: mongoose.Schema.ObjectId, ref: "School", required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  supplier_code: { type: String, required: true },
  seq: { type: Number, default: 0 },
  // geolocation: { type: mongoose.Schema.ObjectId, ref: "Class" },
  joinDate: { type: Date, default: new Date() },
  status: {
    type: String,
    required: false,
    default: "active",
  },
  phone_no: { type: String, required: true },
  registration_no: { type: String, default: null },
  address: { type: String, default: null },
  zipcode: { type: String, default: null },
  supplier_image: { type: String, default: null },
  public_id: { type: String, default: "" },
  image: {
    url: String,
    public_id: String,
  },
  createdAt: { type: Date, default: new Date() },
  password: { type: String, required: true },
});

// ✅ Compound unique index
supplierSchema.index({ school: 1, supplier_code: 1 }, { unique: true });
module.exports = mongoose.model("Supplier", supplierSchema);
