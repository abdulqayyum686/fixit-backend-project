// Importing important packages
const express = require("express");
const app = express();
const UserRoute = express.Router();
const config = require("config");
const jwt = require("jsonwebtoken");
let Client = require("../Models/client");
const sendEmail = require("../utils/sendEmail");
const upload = require("../utils/uploadImages");
const bcrypt = require("bcryptjs");
const jwt_decode = require("jwt-decode");
const saltRounds = 10;

UserRoute.route("/add-client").post(
  upload.single("profile"),
  async function (req, res) {
    let image = null;
    if (req.file) {
      image = "img/" + req.file.filename;
    }
    let found = await Client.findOne({ email: req.body.email });
    if (found) {
      res.status(500).json({ message: "Email already exist" });
      return;
    }

    await bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        console.log(" error: ", err);
        return res.status(500).json({ err: err });
      } else {
        let Users = new Client({
          ...req.body,
          accountType: "client",
          profile: image ? image : null,
          password: hash,
        });

        Users.save()
          .then((User) => {
            console.log("data===", User);
            const token = jwt.sign(
              { ...User.toObject(), password: "" },
              "secret",
              {
                expiresIn: "5d",
              }
            );
            sendEmail(
              User?.email,
              "Email Confirmation",
              "normal",
              token,
              "client"
            );
            res.status(200).json({
              User: "client added successfully",
              token: token,
              message: "Login successfully",
              user: User,
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }
);
UserRoute.route("/client-auth").post(function (req, res) {
  console.log(req.body, "client");
  const { email, password } = req.body;
  Client.findOne({ email: { $regex: email, $options: "i" }, isApproved: true })
    .exec()
    .then(async (foundObject) => {
      if (foundObject) {
        console.log("data===", foundObject);

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
          message: "Opps invalid email or account doesnot verified",
        });
      }
    })
    .catch((err) => {
      return res.status(500).json({
        error: err,
      });
    });
});
UserRoute.route("/find/:id").get(function (req, res) {
  console.log("comsatlahore");
  Client.findOne(
    { _id: req.params.id },

    function (error, success) {
      if (error) {
        res.send("error");
      } else {
        if (!success) {
          res.send("invalid");
        } else {
          res.status(200).json({ User: success });
        }
      }
    }
  );
});
UserRoute.route("/getallusers").get(function (req, res) {
  Client.find({}, function (err, users) {
    if (err) {
      res.send("sad");
    } else {
      if (!users) {
        res.send(err);
      } else {
        res.status(200).json({ users });
      }
    }
  });
});
UserRoute.route("/verify/:token").get(async function (req, res) {
  // console.log("req.boyy===", req.body, req.params);
  try {
    if (!req.params.token)
      return res.status(400).send({ message: "Token is missing." });
    let tok = jwt_decode(req.params.token);

    // console.log("new login", tok);
    let user = await Client.findOne({ _id: tok._id });

    if (!user) return res.status(400).send("Link Expired..");
    if (user.isApproved === true) {
      console.log("enter in else if");
      return res.render("emailconfirm", {
        title: "Verified.",
        status: "Email Is Already Verified..",
        icon: "t",
      });
    } else {
      await Client.findOneAndUpdate(
        { _id: tok._id },
        {
          isApproved: true,
        },
        { new: true }
      );
    }
    return res.render("emailconfirm", {
      title: "Verified.",
      status: "Email Verified..",
      icon: "t",
    });
  } catch (error) {
    console.log(error.message);
    return res.render("emailconfirm", {
      title: "Expired",
      status: "Link Expired..",
      icon: "c",
    });
  }
});
UserRoute.route("/delete/:id").post(function (req, res) {
  Client.findById({ _id: req.params.id })
    .deleteOne()
    .then(() => {
      res.status(200).json({ User: "User Delted successfully" });
    });
});
UserRoute.route("/update/:id").put(
  upload.single("profile"),
  async function (req, res) {
    let image = null;
    if (req.file) {
      image = "img/" + req.file.filename;
    }
    if (req.body.password) {
      let newPassword = await bcrypt.hash(req.body.password, 10);
      console.log("newPassword", newPassword);
      req.body.password = newPassword;
    }
    console.log("new password====", req.body.password);

    Client.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        accountType: "client",
        profile: image !== null ? image : req.body.profile,
      },
      { new: true },

      function (error, success) {
        if (error) {
          res.send("error");
        } else {
          if (!success) {
            res.send("invalid");
          } else {
            res.status(200).json({ User: success });
          }
        }
      }
    );
  }
);
UserRoute.route("/forgetPassword").post(function (req, res) {
  const { email } = req.body;
  Client.findOne({ email })
    .exec()
    .then(async (found) => {
      if (found) {
        await sendEmail(
          found.email,
          "Password Reset Link",
          "forgot",
          found._id,
          "client"
        );

        res.status(200).json({
          message: "Your password reset link has been sent to your mail",
        });
      } else {
        return res.status(404).json({
          message: "Sorry ! User not Found",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
UserRoute.route("/updatePassword/:id").put(async function (req, res) {
  const { newPassword } = req.body;
  console.log("updatePassword", newPassword, req.params.id);
  let user = await Client.findOne({ _id: req.params.id });
  try {
    if (!user) {
      res.status(404).json({
        message: "Sorry ! User not found",
      });
    }
    bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
      if (err) {
        return res.status(500).json({
          message: "password decryption error",
        });
      } else {
        let updatedUser = await Client.findOneAndUpdate(
          { _id: req.params.id },
          { password: hash },
          { useFindAndModify: false, new: true }
        );
        if (updatedUser) {
          res.status(201).json({
            message: "Password has been changed successfully",
          });
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
});
module.exports = UserRoute;
