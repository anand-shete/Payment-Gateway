Awesome. Moving from Razorpay PG (Payment Gateway) to RazorpayX is a shift from collecting money to disbursing money.
While Razorpay PG lets customers pay you, RazorpayX is a business banking platform. Your company uses it to payout money automatically to vendors, employees, sellers, or customer refunds via APIs.

---

## The Architecture: How RazorpayX Works

Unlike the PG which triggers a popup, RazorpayX works entirely on your backend server. It relies on a structural hierarchy:

```
[ Your Business / RazorpayX Account ]
               │
               ▼
       [ Contacts ]  (The people you pay: Vendors, Employees, Customers)
               │
               ▼
     [ Fund Accounts ] (Where the money goes: Bank Account, UPI ID, Wallet)
               │
               ▼
       [ Payouts ]   (The actual money transfer request)
```

## The 3 Core API Steps to Code a Payout

To master RazorpayX, you must know how to chain these three backend operations together:

## 1. Create a Contact

Before sending money, you must register the receiver in RazorpayX.

```js
// POST https://razorpay.com
const contact = await razorpayX.contacts.create({
  name: "John Doe",
  email: "john@example.com",
  contact: "9999999999",
  type: "vendor", // e.g., employee, vendor, customer
});
const contactId = contact.id; // e.g., cont_00000000000001
```

## 2. Create a Fund Account

Attach financial destination details (like a Bank Account or UPI ID) to that specific contact_id.

```js
// POST https://razorpay.com
const fundAccount = await razorpayX.fundAccounts.create({
  contact_id: contactId,
  account_type: "vpa", // 'vpa' for UPI, 'bank_account' for IMPS/NEFT
  vpa: {
    address: "johndoe@upi",
  },
});

const fundAccountId = fundAccount.id; // e.g., fa_00000000000001
```

## 3. Create a Payout

Trigger the actual money transfer from your RazorpayX smart wallet to their fund account.

```js
// POST https://razorpay.com

const payout = await razorpayX.payouts.create({
  account_number: "2221001033333333", // Your RazorpayX business account number
  fund_account_id: fundAccountId,
  amount: 100000, // Amount in paise (100000 = ₹1,000.00)
  currency: "INR",
  mode: "UPI", // UPI, IMPS, NEFT, RTGS
  purpose: "vendor bill",
  queue_if_low_balance: true, // Queues the payout if your wallet runs dry
});
```

## ⚠️ The Golden Rule of RazorpayX: Webhooks are Mandatory

In Razorpay PG, you checked success immediately using the handler or frontend fetch. You cannot do this in RazorpayX.
Payouts are asynchronous. When you create a payout, the API will almost always return a status of processing or queued. The bank might take 2 minutes or 2 hours to clear the transfer. You must set up RazorpayX Webhooks to listen for:

- payout.processed (Money successfully hit the destination bank account)
- payout.failed (Transfer failed; money is reversed back to your wallet)
- payout.reversed (Bank accepted the transfer but returned it later)

To help us dive deeper, tell me:

- What specific use case does your company use RazorpayX for? (e.g., automated refunds, vendor payouts, salary distribution)
- Do you need to see how to set up the authentication headers for RazorpayX (since it uses a different base URL than the regular PG)?
