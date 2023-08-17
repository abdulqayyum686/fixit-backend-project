// Importing important packages
const express = require("express");
const app = express();
const ProfessionalRoute = express.Router();
const config = require("config");
const jwt = require("jsonwebtoken");
let Professional = require("../Models/professional");
var nodemailer = require("nodemailer");
const sendEmail = require("../utils/sendEmail");
const jwt_decode = require("jwt-decode");
const upload = require("../utils/uploadImages");
const bcrypt = require("bcryptjs");
const stripe = require("stripe")(
  "sk_test_51NX1sqIczjEzgJwauX7bzE4SLUuvNoZIpFMvvH0n2Rl0pBBR0YYCyUIlMWmKAjUh8kidVseIccFViCLCdfnhiBfN00tv2JqTsN"
);
const saltRounds = 10;

ProfessionalRoute.route("/add-professional").post(
  upload.fields([
    { name: "uq", maxCount: 1 },
    { name: "ub", maxCount: 1 },
    { name: "iu", maxCount: 10 },
  ]),
  async function (req, res) {
    let type = req.body.accountPaymentStatus;
    let uq = null;
    let ub = null;
    let iu = null;
    // console.log("req.files", req.files);
    if (req.files.uq) {
      uq = "img/" + req.files.uq[0].filename;
    }
    if (req.files.ub) {
      ub = "img/" + req.files.ub[0].filename;
    }
    let array = [];
    if (req.files.iu) {
      for (let i = 0; i < req.files.iu.length; i++) {
        array.push("img/" + req.files.iu[i].filename);
      }
      iu = array;
    }

    const user = await Professional.findOne({ email: req.body.email });
    console.log("user====", user !== null, user);
    if (user !== null) {
      return res.status(500).json({
        message: "Email already exist",
      });
    }

    await bcrypt.hash(req.body.password, 10, (err, hash) => {
      if (err) {
        console.log(" error: ", err);
        return res.status(500).json({ err: err });
      } else {
        delete req.body["accountPaymentStatus"];
        let Users = new Professional({
          ...req.body,
          accountType: "professional",
          uq: uq ? uq : null,
          ub: ub ? ub : null,
          iu: iu ? iu : null,
          password: hash,
          services: JSON.parse(req.body.services),
          prices: JSON.parse(req.body.prices),
        });
        Users.save()
          .then(async (User) => {
            console.log("data===", "User");
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
              "professional"
            );
            // stripe payment gateway
            if (type === "premium") {
              const customer = await stripe.customers.create({
                description:
                  "My First Test Customer (created for API docs at https://www.stripe.com/docs/api)",
                metadata: { professional_id: User._id.toString() },
              });
              console.log("kkk===============", customer);
              const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: [
                  { price: "price_1NdfXOIczjEzgJwaP1szukZm", quantity: 1 },
                ],
                mode: "subscription",
                customer: customer.id,
                success_url: `http://18.170.102.108/`,
                cancel_url: `http://18.170.102.108/`,
              });
              res.status(200).json({
                url: session.url,
              });
            }
            if (type !== "premium") {
              res.status(200).json({
                message: "Professional added successfully",
                token: token,
                message: "Login successfully",
                user: User,
              });
            }
          })
          .catch((err) => {
            console.log(err);
          });
      }
    });
  }
);
ProfessionalRoute.route("/stripe-payment-webhook").post(async function (
  req,
  res
) {
  console.log("my payment web hook is triggred", req.body);
  const sig = req.headers["stripe-signature"];
  let event = req.body;
  let data = req.body.data.object;
  // console.log("event", event);
  // console.log("data", data);
  console.log("eventtype", event.type);
  if (event.type === "checkout.session.completed") {
    // console.log("data=============================", data);
    let customer = await stripe.customers.retrieve(data.customer);
    // console.log("stripe customer======", customer.metadata.professional_id);
    // console.log("enter in conmpleted", customer);
    const subscriptionId = data.subscription;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await Professional.findByIdAndUpdate(
      { _id: customer.metadata.professional_id },
      {
        cus_Id: customer.id,
        accountPaymentStatus: true,
        subscription: subscription,
      },
      { useFindAndModify: false, new: true }
    );
  }
  if (event.type === "checkout.session.expired") {
    // console.log("enter in payment_failed");
    let customer = await stripe.customers.retrieve(data.customer);
    // console.log("stripe customer======333", customer.metadata.professional_id);
    await Professional.findByIdAndRemove(
      { _id: customer.metadata.professional_id },
      { useFindAndModify: false, new: true }
    );
  }
  if (event.type === "checkout.session.async_payment_failed") {
    // console.log("enter in payment_failed");
    let customer = await stripe.customers.retrieve(data.customer);
    // console.log("stripe customer======333", customer.metadata.professional_id);
    await Professional.findByIdAndRemove(
      { _id: customer.metadata.professional_id },
      { useFindAndModify: false, new: true }
    );
  }
  // Return a 200 response to acknowledge receipt of the event
  res.status(200).send("completed");
});
ProfessionalRoute.route("/professional-auth").post(function (req, res) {
  console.log(req.body);
  const { email, password } = req.body;
  Professional.findOne({ email: email, isApproved: true })
    .exec()
    .then(async (foundObject) => {
      if (foundObject) {
        await bcrypt.compare(
          password,
          foundObject.password,
          async (err, newResult) => {
            if (err) {
              return res.status(501).json({ err, err });
            } else {
              if (newResult) {
                let obj = { ...foundObject.toObject() };
                delete obj["subscription"];
                const token = jwt.sign({ ...obj, password: "" }, "secret", {
                  expiresIn: "5d",
                });

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
ProfessionalRoute.route("/find").get(function (req, res) {
  Professional.find()
    .populate("reviews.reviewerID")
    .exec(function (error, success) {
      if (error) {
        res.send("error");
      } else {
        if (!success) {
          res.send("invalid");
        } else {
          res.status(200).send(success);
        }
      }
    });
});
ProfessionalRoute.route("/find/:id").get(function (req, res) {
  Professional.findOne({ _id: req.params.id })
    .populate("reviews.reviewerID")
    .exec(function (error, success) {
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
ProfessionalRoute.route("/delete/:id").post(function (req, res) {
  Professional.findById({ _id: req.params.id })
    .deleteOne()
    .then(() => {
      res.status(200).json({ User: "User Delted successfully" });
    });
});
ProfessionalRoute.route("/delete-review/:id/:reviewId").post(async function (
  req,
  res
) {
  try {
    console.log("object", req.params);
    let professional = await Professional.findOne({ _id: req.params.id });
    let clone = [...professional.reviews];
    let array = clone.filter(
      (p) => p._id.toString() !== req.params.reviewId.toString()
    );
    console.log("array", array);

    Professional.findByIdAndUpdate(
      { _id: req.params.id },
      {
        reviews: array,
      },
      { new: true }
    )
      .then((updatedDocument) => {
        console.log("Document updated:", updatedDocument);
        res.status(200).json({
          message: "Review deleted successfully",
          updatedDocument,
        });
      })
      .catch((error) => {
        console.error("Error updating document:", error);
        res.status(500).json({ error });
      });
  } catch (err) {
    console.log("Error deleting sub task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
ProfessionalRoute.route("/change-review-status/:id").post(async function (
  req,
  res
) {
  const { reviews } = req.body;
  try {
    Professional.findByIdAndUpdate(
      { _id: req.params.id },
      {
        reviews: reviews,
      },
      { new: true }
    )
      .then((updatedDocument) => {
        console.log("Document updated:", updatedDocument);
        res.status(200).json({
          message: "Review Status Changed successfully",
          updatedDocument,
        });
      })
      .catch((error) => {
        console.error("Error updating document:", error);
        res.status(500).json({ error });
      });
  } catch (err) {
    console.log("Error deleting sub task:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
ProfessionalRoute.route("/update/:id").put(
  upload.fields([
    { name: "uq", maxCount: 1 },
    { name: "ub", maxCount: 1 },
    { name: "iu", maxCount: 10 },
  ]),
  async function (req, res) {
    let uq = null;
    let ub = null;
    let iu = null;

    if (req?.files?.uq) {
      uq = "img/" + req.files.uq[0].filename;
    }
    if (req?.files?.ub) {
      ub = "img/" + req.files.ub[0].filename;
    }
    let array = [];
    if (req?.files?.iu) {
      for (let i = 0; i < req.files.iu.length; i++) {
        array.push("img/" + req.files.iu[i].filename);
      }
      iu = array;
    }
    if (req?.body?.password) {
      let newPassword = await bcrypt.hash(req.body.password, 10);
      console.log("newPassword", newPassword);
      req.body.password = newPassword;
    }
    console.log("new password====", req.body.password);
    if (req.body.accountPaymentStatus === false) {
      const deleted = await stripe.subscriptions.cancel(
        req.body.sub_Id.toString()
      );
      console.log("data===", req.body.sub_Id.toString());
      if (deleted) {
        req.body.subscription = null;
      }
    }

    Professional.findOneAndUpdate(
      { _id: req.params.id },
      {
        ...req.body,
        accountType: "professional",
        services: JSON.parse(req.body.services),
        prices: JSON.parse(req.body.prices),
        uq: uq ? uq : req.body.uq,
        ub: ub ? ub : req.body.ub,
        iu: iu ? iu : JSON.parse(req.body.iu),
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
ProfessionalRoute.route("/enhanced-subscription/:id").put(async function (
  req,
  res
) {
  const { cus_Id } = req.body;
  console.log("cus_Id", cus_Id);
  const session = await stripe.checkout.sessions.create({
    line_items: [{ price: "price_1NdfXOIczjEzgJwaP1szukZm", quantity: 1 }],
    mode: "subscription",
    customer: cus_Id,
    success_url: `http://18.170.102.108/`,
    cancel_url: `http://18.170.102.108/`,
  });
  res.status(200).json({
    url: session.url,
  });
});
ProfessionalRoute.route("/verify/:token").get(async function (req, res) {
  // console.log("req.boyy===", req.body, req.params);
  try {
    if (!req.params.token)
      return res.status(400).send({ message: "Token is missing." });
    let tok = jwt_decode(req.params.token);

    console.log("new login", tok);
    let user = await Professional.findOne({ _id: tok._id });

    if (!user) return res.status(400).send("Link Expired..");
    if (user.isApproved === true) {
      console.log("enter in else if");
      return res.render("emailconfirm", {
        title: "Verified.",
        status: "Email Is Already Verified..",
        icon: "t",
      });
    } else {
      await Professional.findOneAndUpdate(
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
ProfessionalRoute.route("/forgetPassword").post(function (req, res) {
  const { email } = req.body;
  Professional.findOne({ email })
    .exec()
    .then(async (found) => {
      if (found) {
        await sendEmail(
          found.email,
          "Password Reset Link",
          "forgot",
          found._id,
          "professional"
        );

        res.status(200).json({
          message: "Your password reset link has been sent to your mail",
        });
      } else {
        return res.status(404).json({
          message: "Sorry ! User not found",
        });
      }
    })
    .catch((err) => {
      res.status(500).json({
        error: err,
      });
    });
});
ProfessionalRoute.route("/updatePassword/:id").put(async function (req, res) {
  const { newPassword } = req.body;
  let user = await Professional.findOne({ _id: req.params.id });
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
        let updatedUser = await Professional.findOneAndUpdate(
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

module.exports = ProfessionalRoute;
