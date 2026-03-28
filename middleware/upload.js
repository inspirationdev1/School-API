const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "students";
    let resource_type = "image"; // default

    if (file.fieldname === "parentImage") {
      folder = "parents";
    }

    // 👉 Detect file type
    if (file.mimetype === "application/pdf") {
      resource_type = "raw"; // IMPORTANT for PDF
    }

    return {
      folder,
      resource_type,
      format: file.mimetype === "application/pdf" ? "pdf" : undefined,
      public_id: Date.now() + "-" + file.originalname.replace(/\s/g, "_"),
    };
  },
});

const upload = multer({ storage });

module.exports = upload;