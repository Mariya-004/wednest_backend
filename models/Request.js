const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    couple_id: { type: mongoose.Schema.Types.ObjectId, ref: "Couple", required: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true },
    status: { type: String, enum: ["Pending", "Accepted", "Rejected"], default: "Pending" },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
