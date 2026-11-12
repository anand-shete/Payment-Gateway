require("dotenv/config");
const path = require("path");
const express = require("express");
const { razorpay } = require("./config");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");
const { createHmac } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

let DB = [];

app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;
    if (amount < 0 || !currency || !receipt) {
      return res.status(400).json({ error: "all fields are required and must be valid" });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert amount to paise
      currency,
      receipt,
      notes,
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating order");
  }
});

// 5. verify if payment success
app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: "invalid_credentials" });
    }

    const secret = razorpay.key_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // check if signature is valid
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    if (!isValidSignature) {
      console.log("Payment verification failed");
      return res.status(400).json({ status: "verification_failed" });
    }

    const expectedSignature = createHmac("sha256", secret).update(body.toString()).digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.log("Payment verification failed: Invalid Signature");
      return res.status(400).json({ status: "verification_failed" });
    }

    // find order id from database
    const order = DB.filter((o) => o.order_id === razorpay_order_id);
    if (!order) {
      return res.status(404).json({ status: "invalid_order_id" });
    }

    // fetch payment details from razorpay
    // update status of order in database
    const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
    // console.log("payment details: ", paymentDetails);

    // payment success
    if (paymentDetails.status === "captured") {
      order.status = "paid";
      order.payment_id = razorpay_payment_id;
      console.log("Payment verification successful (Captured)");
      return res.status(200).json({ status: "ok" });
    }

    // payment pending (Money deducted, but stuck in transit)
    else if (paymentDetails.status === "authorized") {
      order.status = "pending_verification";
      order.payment_id = razorpay_payment_id;
      console.log("Payment is Authorized but pending capture");
      return res.status(200).json({ status: "pending" });
    }

    // payment failed
    order.status = "failed";
    console.log(`Payment failed on Razorpay with status: ${paymentDetails.status}`);

    return res.status(400).json({
      status: "failed",
      message: paymentDetails.error_description || "Payment failed",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error verifying payment" });
  }
});

app.get("/payment-success", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.get("/payment-failed", (req, res) => {
  res.sendFile(path.join(__dirname, "failed.html"));
});

app.listen(PORT, () => console.log(`server started at http://localhost:${PORT}`));
