const mongoose = require("mongoose");

const VendorSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    businessName: { type: String, default: "" },
    vendorType: { type: String, default: "" },
    contactNumber: { type: String, default: "" },
    location: { type: String, default: "" },
    pricing: { type: Number, default: 0 },
    profile_image: { type: String, default: "" }, // ✅ Profile picture field
    service_images: { type: [String], default: [] }, // ✅ Array for multiple service images
    serviceDescription: { type: String, default: "" }, // ✅ Service description
    earnings: { type: Number, default: 0 },
    upcomingBookings: { type: [String], default: [] },
    ratings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Vendor", VendorSchema);
