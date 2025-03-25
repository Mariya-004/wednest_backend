const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require("cors");;
const connectDB = require('./db');
const Couple = require('./models/Couple');
const Vendor = require('./models/Vendor');
const Request = require('./models/Request');
const Cart = require('./models/Cart');
const { upload } = require('./cloudinaryConfig');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret';
const URL = process.env.BACKEND_URL || 'http://localhost:3000';
// Connect to database
connectDB();

app.use(express.json());

// ✅ CORS FIX
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "https://wednest-frontend-orcin.vercel.app"); 
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors({
    origin: [
        "http://localhost:3000", 
        "https://wednest-frontend-orcin.vercel.app"
    ],
    credentials: true
}));


app.get("/", (req, res) => {
  res.send("Backend is running!");
});
//
// ✅ REGISTER API
app.post('/api/register', async (req, res) => {
    const { username, email, password, user_type } = req.body;

    if (!username || !email || !password || !user_type) {
        return res.status(400).json({ status: "error", message: "All fields are required" });
    }

    const validUserTypes = ["Couple", "Vendor"];
    if (!validUserTypes.includes(user_type)) {
        return res.status(400).json({ status: "error", message: "Invalid user type" });
    }

    try {
        // Check if email exists in either collection
        const existingUser = await Couple.findOne({ email }) || await Vendor.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ status: "error", message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let newUser;
        if (user_type === "Couple") {
            newUser = new Couple({ username, email, password: hashedPassword });
        } else {
            newUser = new Vendor({ username, email, password: hashedPassword });
        }

        await newUser.save();
        res.status(201).json({ status: "success", message: "Account created successfully" });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ✅ LOGIN API
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: "error", message: "Email and password are required" });
    }

    try {
        let user = await Couple.findOne({ email });
        let userType = "Couple";

        if (!user) {
            user = await Vendor.findOne({ email });
            userType = "Vendor";
        }

        if (!user) {
            return res.status(400).json({ status: "error", message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: "error", message: "Invalid email or password" });
        }

        const token = jwt.sign({ user_id: user._id, user_type: userType }, SECRET_KEY, { expiresIn: '1h' });

        res.status(200).json({
            status: "success",
            message: "Login successful",
            data: { user_id: user._id, user_type: userType, token },
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ✅ LOGOUT API
app.post('/api/logout', (req, res) => {
    res.status(200).json({ status: "success", message: "Logout successful" });
});

// ✅ UPDATE PROFILE API (Couple)
app.put('/api/couple/profile', upload.single('profileImage'), async (req, res) => {
    let { user_id, username, contactNumber, weddingDate, budgetRange } = req.body;

    if (!user_id) {
        return res.status(400).json({ status: "error", message: "User ID is required" });
    }

    // Validate user_id format
    user_id = user_id.trim();
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ status: "error", message: "Invalid User ID format" });
    }

    try {
        let updatedData = { 
            username, 
            contact_number: contactNumber, 
            wedding_date: weddingDate, 
            budget: budgetRange 
        };

        if (req.file) {
            updatedData.profile_image = req.file.path; // Cloudinary URL
        }

        const updatedCouple = await Couple.findByIdAndUpdate(user_id, updatedData, { new: true });

        if (!updatedCouple) {
            return res.status(404).json({ status: "error", message: "Couple not found" });
        }

        res.status(200).json({ status: "success", message: "Profile updated", data: updatedCouple });
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});


// ✅ GET COUPLE PROFILE API
app.get('/api/couple/profile/:user_id', async (req, res) => {
    let { user_id } = req.params;

    // Trim and validate user_id
    user_id = user_id.trim();
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ status: "error", message: "Invalid User ID format" });
    }

    try {
        const couple = await Couple.findById(user_id);

        if (!couple) {
            return res.status(404).json({ status: "error", message: "Profile not found" });
        }

        res.status(200).json({ status: "success", data: couple });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

// ✅ GET COUPLE DASHBOARD DATA
app.get('/api/couple/dashboard/:user_id', async (req, res) => {
    let { user_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ status: "error", message: "Invalid User ID format" });
    }

    try {
        const couple = await Couple.findById(user_id).populate('booked_vendors.vendor_id', 'name service_type');

        if (!couple) {
            return res.status(404).json({ status: "error", message: "User not found" });
        }

        res.status(200).json({
            status: "success",
            data: {
                username: couple.username,
                email: couple.email,
                wedding_date: couple.wedding_date || "Not Set",
                budget: couple.budget ,
                profile_image: couple.profile_image, 
                booked_vendors: couple.booked_vendors || []
            }
        });
    } catch (error) {
        console.error("Couple Dashboard Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});
// ✅ VENDOR PROFILE UPDATE API (WITH SERVICE IMAGES)
app.put('/api/vendor/profile', upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'serviceImages', maxCount: 5 }]), async (req, res) => {
    let { user_id, businessName, vendorType, contactNumber, location, pricing, serviceDescription } = req.body;

    if (!user_id || !mongoose.Types.ObjectId.isValid(user_id.trim())) {
        return res.status(400).json({ status: "error", message: "Invalid or missing User ID" });
    }

    try {
        let updatedData = { businessName, vendorType, contactNumber, location, pricing, serviceDescription };

        if (req.files.profileImage) {
            updatedData.profile_image = req.files.profileImage[0].path; // Cloudinary URL
        }

        if (req.files.serviceImages) {
            updatedData.service_images = req.files.serviceImages.map(file => file.path);
        }

        const updatedVendor = await Vendor.findByIdAndUpdate(user_id.trim(), updatedData, { new: true });

        if (!updatedVendor) {
            return res.status(404).json({ status: "error", message: "Vendor not found" });
        }

        res.status(200).json({ status: "success", message: "Profile updated", data: updatedVendor });
    } catch (error) {
        console.error("Update Vendor Profile Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});


// ✅ GET VENDOR PROFILE API
app.get('/api/vendor/profile/:vendor_id', async (req, res) => {
    let { vendor_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendor_id.trim())) {
        return res.status(400).json({ status: "error", message: "Invalid Vendor ID format" });
    }

    try {
        const vendor = await Vendor.findById(vendor_id.trim());

        if (!vendor) {
            return res.status(404).json({ status: "error", message: "Profile not found" });
        }

        res.status(200).json({ status: "success", data: vendor });
    } catch (error) {
        console.error("Get Vendor Profile Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

app.get('/api/vendor/dashboard/:user_id', async (req, res) => {
    let { user_id } = req.params;

    // Validate user_id
    user_id = user_id.trim();
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
        return res.status(400).json({ status: "error", message: "Invalid User ID format" });
    }

    try {
        // Find vendor by user_id
        const vendor = await Vendor.findById(user_id);

        if (!vendor) {
            return res.status(404).json({ status: "error", message: "Vendor not found" });
        }

        res.status(200).json({
            status: "success",
            data: {
                username: vendor.username,
                email: vendor.email,
                business_name: vendor.businessName || "",
                vendor_type: vendor.vendorType || "",
                earnings: vendor.earnings || 0,
                profile_image: vendor.profile_image || "/profile.png",
                upcoming_bookings: vendor.upcomingBookings || [],
                ratings: vendor.ratings || 0,
                service_images: vendor.service_images || [],
                serviceDescription: vendor.description || ""
            }
        });

    } catch (error) {
        console.error("Vendor Dashboard Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

//✅ Specific type of vendors

app.get('/api/vendors/type/:vendorType', async (req, res) => {
    const { vendorType } = req.params;

    try {
        const vendors = await Vendor.find({ vendorType: vendorType });

        if (vendors.length === 0) {
            return res.status(404).json({ status: "error", message: "No vendors found for this type" });
        }

        res.status(200).json({ status: "success", data: vendors });
    } catch (error) {
        console.error("Fetch Vendors by Type Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});
// ✅ GET VENDOR DETAILS API
app.get('/api/vendor/details/:vendor_id', async (req, res) => {
    let { vendor_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendor_id.trim())) {
        return res.status(400).json({ status: "error", message: "Invalid Vendor ID format" });
    }

    try {
        const vendor = await Vendor.findById(vendor_id.trim());

        if (!vendor) {
            return res.status(404).json({ status: "error", message: "Vendor not found" });
        }

        res.status(200).json({ status: "success", data: vendor });
    } catch (error) {
        console.error("Get Vendor Details Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});
// ✅ SEND REQUEST API
app.post('/api/request', async (req, res) => {
    const {couple_id, vendor_id}=req.body;
    console.log("Incoming Request Body:", req.body);
    if(!couple_id || !vendor_id){
        return res.status(400).json({status: "error", message: "Couple ID and Vendor ID are required"});
    }
    try{
        const existingRequest=await Request.findOne({couple_id, vendor_id, status: "Pending"});
        if(existingRequest){
            return res.status(400).json({status: "error", message: "Request already sent waiting for response"});
        }
        // Create new request
        const newRequest=new Request({couple_id, vendor_id});
        await newRequest.save();
        res.status(201).json({status: "success", message: "Request sent successfully"});
    }catch(error){
        console.error("Send Request Error:", error);
        res.status(500).json({status: "error", message: "Server error"});

    }
});
app.get("/api/couple/requests/:couple_id", async (req, res) => {
    const { couple_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couple_id)) {
        return res.status(400).json({ status: "error", message: "Invalid Couple ID" });
    }

    try {
        const requests = await Request.find({ couple_id })
            .populate("vendor_id", "username businessName vendorType");

        res.status(200).json({ status: "success", data: requests });
    } catch (error) {
        console.error("Fetch Requests Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

app.get("/api/vendor/requests/:vendor_id", async (req, res) => {
    const { vendor_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendor_id)) {
        return res.status(400).json({ status: "error", message: "Invalid Vendor ID" });
    }

    try {
        const requests = await Request.find({ vendor_id })
            .populate("couple_id", "username email");

        res.status(200).json({ status: "success", data: requests });
    } catch (error) {
        console.error("Fetch Requests Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});

app.get("/api/request-id", async (req, res) => {
    const { couple_id, vendor_id } = req.query;
  
    if (!couple_id || !vendor_id) {
      return res.status(400).json({ status: "error", message: "couple_id and vendor_id are required" });
    }
  
    if (!mongoose.Types.ObjectId.isValid(couple_id) || !mongoose.Types.ObjectId.isValid(vendor_id)) {
      return res.status(400).json({ status: "error", message: "Invalid couple_id or vendor_id format" });
    }
  
    try {
      const request = await Request.findOne({ couple_id, vendor_id });
  
      if (!request) {
        return res.status(404).json({ status: "error", message: "No request found for given couple_id and vendor_id" });
      }
  
      res.status(200).json({
        status: "success",
        request_id: request._id,
        data: request,
      });
    } catch (error) {
      console.error("🚨 Fetch Request ID Error:", error);
      res.status(500).json({ status: "error", message: "Server error" });
    }
  });
  
// ✅ ACCEPT/DECLINE REQUEST API
app.put('/api/request/:request_id', async (req, res) => {
    const { request_id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(request_id.trim())) {
        return res.status(400).json({ status: "error", message: "Invalid Request ID format" });
    }

    if (!["Accepted", "Declined"].includes(status)) {
        return res.status(400).json({ status: "error", message: "Invalid status. Must be 'Accepted' or 'Declined'" });
    }

    try {
        const request = await Request.findByIdAndUpdate(request_id.trim(), { status }, { new: true });

        if (!request) {
            return res.status(404).json({ status: "error", message: "Request not found" });
        }

        res.status(200).json({ status: "success", message: `Request ${status.toLowerCase()} successfully`, data: request });
    } catch (error) {
        console.error("Update Request Status Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});
// ✅ ADD TO CART API
  app.post("/api/cart/add", async (req, res) => {
    const { couple_id, vendor_id, service_type, price, request_id } = req.body;
  
    if (!couple_id || !vendor_id || !service_type || !price || !request_id) {
      return res.status(400).json({ status: "error", message: "All fields are required" });
    }
  
    if (
      !mongoose.Types.ObjectId.isValid(couple_id) ||
      !mongoose.Types.ObjectId.isValid(vendor_id) ||
      !mongoose.Types.ObjectId.isValid(request_id)
    ) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }
  
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ status: "error", message: "Invalid price format" });
    }
  
    try {
      let cart = await Cart.findOne({ couple_id });
  
      if (!cart) {
        cart = new Cart({ couple_id, items: [], total_budget: 0 });
      }
  
      cart.items.push({
        vendor_id,
        service_type,
        price: parsedPrice,
        request_id,
        status: "Waiting for Confirmation",
      });
  
      cart.total_budget += parsedPrice;
  
      await cart.save();
  
      res.status(201).json({ status: "success", message: "Item added to cart", data: cart });
    } catch (error) {
      console.error("🚨 Add to Cart Error:", error);
      res.status(500).json({ status: "error", message: "Server error" });
    }
  });
  
// get couple's budget api
app.get("/api/couple/budget/:couple_id", async (req, res) => {
    const {couple_id} =req.params;
    if (!couple_id) {
        return res.status(400).json({ status: "error", message: "Couple ID is required" });
    }
    try {
        const couple = await Couple.findById(couple_id);
        if (!couple) {
            return res.status(404).json({ status: "error", message: "Couple not found" });
        }
        res.status(200).json({ status: "success", data: couple.budget });
    } catch (error) {
        console.error("Get Couple Budget Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
})
// get cart api
app.get('/api/cart/:couple_id', async (req, res) => {
    const { couple_id } = req.params;
  
    if (!mongoose.Types.ObjectId.isValid(couple_id.trim())) {
      return res.status(400).json({ status: "error", message: "Invalid Couple ID" });
    }
  
    try {
      const cart = await Cart.findOne({ couple_id })
        .populate('items.vendor_id', 'username businessName vendorType');
  
      if (!cart || cart.items.length === 0) {
        return res.status(200).json({ status: "success", data: [], message: "No items in cart." });
      }
  
      res.status(200).json({ status: "success", data: cart.items });
    } catch (error) {
      console.error("Fetch Cart Error:", error);
      res.status(500).json({ status: "error", message: "Server error" });
    }
  });

  // delete item from cart api
  app.delete('/api/cart/remove', async (req, res) => {
    const { couple_id, vendor_id } = req.body;

    if (!couple_id || !vendor_id) {
        return res.status(400).json({ status: "error", message: "Couple ID and Vendor ID are required" });
    }

    try {
        // Find the couple's cart
        const cart = await Cart.findOne({ couple_id });

        if (!cart) {
            return res.status(404).json({ status: "error", message: "Cart not found for this couple" });
        }

        // Find the item inside the cart
        const item = cart.items.find(
            (i) => i.vendor_id.toString() === vendor_id.toString()
        );

        if (!item) {
            return res.status(404).json({ status: "error", message: "Item not found in cart" });
        }

        // Prevent removal if vendor has confirmed
        if (item.status === "Confirmed by Vendor") {
            return res.status(400).json({ status: "error", message: "Cannot remove item confirmed by vendor" });
        }

        // Remove the item
        cart.items = cart.items.filter(
            (i) => i.vendor_id.toString() !== vendor_id.toString()
        );

        // Recalculate total budget
        cart.total_budget = cart.items.reduce((total, curr) => total + curr.price, 0);

        await cart.save();

        res.status(200).json({ status: "success", message: "Item removed from cart" });
    } catch (error) {
        console.error("Remove from Cart Error:", error);
        res.status(500).json({ status: "error", message: "Server error" });
    }
});


// ✅ SERVER START
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
