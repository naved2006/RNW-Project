const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // spaces / special characters hata do, taaki URL safe rahe
    const { name, ext } = path.parse(file.originalname);
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 60) || "cover";
    cb(null, `${Date.now()}-${safeName}${ext.toLowerCase()}`);
  },
});

const onlyImages = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) return cb(null, true);
  cb(new Error("Only image files are allowed"));
};

module.exports = multer({
  storage,
  fileFilter: onlyImages,
  limits: { fileSize: 2 * 1024 * 1024 },
});
