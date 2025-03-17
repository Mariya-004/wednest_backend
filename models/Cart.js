const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    couple_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
      required: true,
    },
    items: [
      {
        vendor_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Vendor",
          required: true,
        },
        service_type: { type: String, required: true },
        price: { type: Number, required: true },
        status: {
          type: String,
          enum: [
            "Waiting for Confirmation",  // Pending request
            "Confirmed by Vendor",      // Accepted request
            "Declined by Vendor"        // Rejected request
          ],
          default: "Waiting for Confirmation",
        },
        request_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Request",
          required: true, // This links the cart item to the actual request
        },
      },
    ],
    total_budget: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
