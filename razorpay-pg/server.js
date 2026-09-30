require("dotenv/config");
const path = require("path");
const express = require("express");
const { razorpay } = require("./config");
const { validateWebhookSignature } = require("razorpay/dist/utils/razorpay-utils");

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
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const secret = razorpay.key_secret;
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    // check if signature is valid
    const isValidSignature = validateWebhookSignature(body, razorpay_signature, secret);
    if (!isValidSignature) {
      res.status(400).json({ status: "verification_failed" });
      console.log("Payment verification failed");
    }

    // find order id from database
    const order = DB.filter((o) => o.order_id === razorpay_order_id);
    if (!order) {
      return res.status(404).json({ status: "invalid_order_id" });
    }

    // Update status of order from database
    order.status = "paid";
    order.payment_id = razorpay_payment_id;

    res.status(200).json({ status: "ok" });
    console.log("Payment verification successful");
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Error verifying payment" });
  }
});

app.get("/payment-success", (req, res) => {
  res.sendFile(path.join(__dirname, "success.html"));
});

app.listen(PORT, () => console.log(`server started at http://localhost:${PORT}`));
