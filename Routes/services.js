// Importing important packages
const express = require("express");
const app = express();
const ServiceRoute = express.Router();
let Service = require("../Models/services");
const sendEmail = require("../utils/sendEmail");
const upload = require("../utils/uploadImages");
const bcrypt = require("bcryptjs");

ServiceRoute.route("/add-service").post(
  upload.single("image"),
  async function (req, res) {
    let image = null;
    if (req.file) {
      image = "img/" + req.file.filename;
    }

    let ServiceObj = new Service({
      ...req.body,
      image: image ? image : null,
    });

    ServiceObj.save()
      .then((service) => {
        res
          .status(200)
          .json({ message: "Services added successfully", service });
      })
      .catch((err) => {
        console.log(err);
      });
  }
);
ServiceRoute.route("/getallservices").get(function (req, res) {
  Service.find({}, function (err, services) {
    if (err) {
      res.send("sad");
    } else {
      if (!services) {
        res.send(err);
      } else {
        res.status(200).json({ services });
      }
    }
  });
});
ServiceRoute.route("/delete-service/:id").post(function (req, res) {
  Service.findById({ _id: req.params.id })
    .deleteOne()
    .then(() => {
      res.status(200).json({ message: "Services Delted successfully" });
    });
});
ServiceRoute.route("/update-service/:id").put(
  upload.single("image"),
  async function (req, res) {
    let image = null;
    if (req.file) {
      image = "img/" + req.file.filename;
    }

    console.log("new password====", req.body.password);

    Service.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        image: image !== null ? image : req.body.image,
      },
      { new: true },

      function (error, success) {
        if (error) {
          res.send("error");
        } else {
          if (!success) {
            res.send("invalid");
          } else {
            res.status(200).json({
              services: success,
              message: "Service updated successfully",
            });
          }
        }
      }
    );
  }
);

module.exports = ServiceRoute;
