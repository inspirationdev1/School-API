const cloudinary = require("cloudinary").v2;
require("dotenv").config();
// CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@da3dxqer8
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

module.exports = cloudinary;
