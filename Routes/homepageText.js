// Importing important packages
const express = require("express");
const homepageTextRoute = express.Router();
let HomepageText = require("../Models/homepageText");

homepageTextRoute.route("/update-text").post(async function (req, res) {
  try {
    let { searchBoxHeading, flixitLocationBudget, customerProfessionalBox } =
      req.body;
    console.log("comsat lahore");
    let found = await HomepageText.findOne({});
    console.log("savedObj", found);

    if (found) {
      found.searchBoxHeading = searchBoxHeading
        ? searchBoxHeading
        : found.searchBoxHeading;

      found.flixitLocationBudget = flixitLocationBudget
        ? flixitLocationBudget
        : found.flixitLocationBudget;

      found.customerProfessionalBox = customerProfessionalBox
        ? customerProfessionalBox
        : found.customerProfessionalBox;
      found
        .save()
        .then((response) => {
          return res.status(201).json({
            message: "Data updatetd  Successfully",
            list: response,
          });
        })
        .catch((err) => {
          return res.status(500).json({
            error: err,
          });
        });
    } else {
      let obj = new HomepageText({ ...req.body });

      obj
        .save()
        .then((savedObj) => {
          res.status(200).json({ list: savedObj });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  } catch (error) {
    console.log("error===", error);
  }
});
homepageTextRoute.route("/get-text").get(async function (req, res) {
  HomepageText.find({}, function (err, list) {
    if (err) {
      res.send("sad");
    } else {
      if (!list) {
        res.send(err);
      } else {
        res.status(200).json({ list });
      }
    }
  });
});

module.exports = homepageTextRoute;
