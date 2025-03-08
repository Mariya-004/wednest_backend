const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// ✅ Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// ✅ Set up multer storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'wednest/uploads',  // Change folder name as needed
        format: async (req, file) => 'png', // Convert all images to PNG
        public_id: (req, file) => Date.now() + '-' + file.originalname.replace(/\s/g, '_')
    }
});

const upload = multer({ storage });

module.exports = { upload, cloudinary };
