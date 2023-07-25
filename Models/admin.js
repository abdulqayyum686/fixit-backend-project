const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let adminSignUpSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    accountType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model("Admin", adminSignUpSchema);
module.exports = Admin;
