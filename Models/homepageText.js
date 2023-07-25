const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let homepageTextScheema = new Schema({
  searchBoxHeading: {
    type: String,
  },
  flixitLocationBudget: {
    type: Object,
  },
  customerProfessionalBox: {
    type: Object,
  },
});

const HomepageText = mongoose.model("HomepageText", homepageTextScheema);
module.exports = HomepageText;
