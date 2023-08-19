const multer = require("multer");
const path = require("path");
const mongoose = require("mongoose");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../Images"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname.replace(/\s+/g, ""));
  },
});
const upload = multer({
  storage: storage,
});

module.exports = upload;
