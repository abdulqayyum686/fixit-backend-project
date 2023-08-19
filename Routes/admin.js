// Importing important packages
const express = require("express");
const adminRoute = express.Router();
const jwt = require("jsonwebtoken");
let Admin = require("../Models/admin");
const bcrypt = require("bcryptjs");

adminRoute.route("/admin-signup").post(async function (req, res) {
  await bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) {
      console.log(" error: ", err);
      return res.status(500).json({ err: err });
    } else {
      let obj = new Admin({
        ...req.body,
        password: hash,
      });

      obj
        .save()
        .then((admin) => {
          console.log("data===", admin);
          let id = jwt.sign({ id: admin?.id }, "jwtPrivateKey", {
            expiresIn: "10m",
          });
          res.status(200).json({ admin: "Admin added successfully" });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
});
adminRoute.route("/admin-auth").post(function (req, res) {
  console.log(req.body, "client");
  const { email, password } = req.body;
  Admin.findOne({ email: { $regex: email, $options: "i" } })
    .exec()
    .then(async (foundObject) => {
      if (foundObject) {
        console.log("data===", foundObject);
        let id = jwt.sign({ id: foundObject.id }, "jwtPrivateKey", {
          expiresIn: "10m",
        });
        // sendEmail(foundObject.email, "Email Confirmation", "normal", id);
        await bcrypt.compare(
          password,
          foundObject.password,
          async (err, newResult) => {
            if (err) {
              return res.status(501).json({ err, err });
            } else {
              if (newResult) {
                const token = jwt.sign(
                  { ...foundObject.toObject(), password: "" },
                  "secret",
                  {
                    expiresIn: "5d",
                  }
                );

                return res.status(200).json({
                  token: token,
                  message: "Login successfully",
                  user: foundObject,
                });
              } else {
                return res.status(401).json({
                  message: "invalid password",
                  action: false,
                });
              }
            }
          }
        );
      } else {
        return res.status(404).json({
          message: "Opps invalid email",
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        error: err,
      });
    });
});

adminRoute.route("/find/:id").get(function (req, res) {
  Admin.findOne({ _id: req.params.id }).exec(function (error, success) {
    if (error) {
      res.send("error");
    } else {
      if (!success) {
        res.send("invalid");
      } else {
        res.status(200).json({ User: success });
      }
    }
  });
});

module.exports = adminRoute;
