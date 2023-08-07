const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let servicesScheema = new Schema({
  value: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const Services = mongoose.model("Services", servicesScheema);
module.exports = Services;
