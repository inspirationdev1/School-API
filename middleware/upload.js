const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "students", // folder in cloudinary
//     allowed_formats: ["jpg", "png", "jpeg"],
//   },
// });

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "students";

    if (file.fieldname === "parentImage") {
      folder = "parents";
    }

    return {
      folder,
      allowed_formats: ["jpg", "png", "jpeg"],
    };
  },
});

const upload = multer({ storage });

module.exports = upload;
