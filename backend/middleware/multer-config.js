const multer = require("multer");
// Image optimizer
const sharp = require("sharp");

const path = require("path");
// File format management
const fs = require("fs");

// storage configuration
const storage = multer.diskStorage({
  // File destination
  destination: (req, file, callback) => {
    callback(null, "images");
  },
  // File Name
  filename: (req, file, cb) => {
    const name = file.originalname.slice(0, 3);
    cb(null, name + Date.now() + ".webp");
  },
});

// file filter
const fileFilter = (req, file, callback) => {
  !file.originalname.match(/\.(jpg|jpeg|png|webp)$/)
    ? callback(
        new Error("Seuls les fichiers JPG, JPEG, PNG et WEBP sont autorisés !"),
        false
      )
    : callback(null, true);
};

// If the folder does not exist, create it
if (!fs.existsSync("images")) {
  fs.mkdirSync("images");
}

// Multer configuration
const upload = multer({ storage: storage, fileFilter: fileFilter }).single(
  "image"
);

module.exports = upload;

module.exports.optimizeImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  const fileName = req.file.filename;
  const outputFilePath = path.join("images", `resized_${fileName}`);

  // Image optimization with sharp
  sharp.cache(false);
  sharp(filePath)
    .resize({ width: 206, height: 260 })
    .toFile(outputFilePath)
    .then(() => {
      console.log(`Image ${fileName} optimisée avec succès `);

      fs.unlink(filePath, () => {
        req.file.path = outputFilePath;
        console.log(
          `Image ${fileName} supprimée avec succès (format non optimisé inutile) `
        );
        next();
      });
    })
    .catch((err) => {
      console.log(err);
      return next();
    });
};