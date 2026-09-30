## Razorpay

Razorpay is an online payment gateway and financial technology platform that lets businesses accept, process, and disburse digital payments.

## Razorpay services

- **Razorpay (Payment Gateway)**: Handles money coming in. It is the customer-facing system you integrate onto your website or app to accept payments via credit cards, UPI, net banking, and wallets.

- **RazorpayX (Business Banking Suite)**: Handles money going out. It is a banking platform where your company can manage digital current accounts, pay vendor invoices, automate employee payroll, and process corporate tax filings.

- **Razorpay POS (Offline Payments)**: Following its acquisition of the offline payment player Ezetap, Razorpay POS handles physical, in-store payment hardware. If you run a retail shop, supermarket, or restaurant, it provides Card Swipe Machines (Android Smart POS devices) and Soundboxes (like the Bharat Soundbox that reads out loud when a UPI payment is successful).

- **E-Commerce & Checkout Enhancements**: Razorpay offers specialized software tools to help online stores increase sales conversions:
  - **Magic Checkout**: A feature that autofills shipping addresses and contact details for customers across thousands of different e-commerce websites, speeding up the checkout process to reduce cart abandonment.
  - **Razorpay Optimizer**: An AI-powered routing tool for enterprise businesses that automatically routes customer payments across multiple payment gateways to ensure the highest transaction success rate.

- **Razorpay Rize (For Startups)**: Razorpay Rize is a specialized platform aimed directly at early-stage startup founders. Instead of payment processing, it focuses on business creation like:
  - **Incorporation Services**: Helping founders register Private Limited (Pvt Ltd) companies or LLPs.
  - **Startup Perks**: Providing access to discounted cloud credits (like AWS), corporate credit cards, and community mentorship.

## KYC & Compliance Regulations

The RBI enforces rigorous auditing guidelines. Unlike some western platforms where you can enter a sandbox, test, and start charging live cards in 10 minutes, Indian gateways require detailed business onboarding:

- You will need a legitimate business identity (Sole Proprietorship, LLP, or Pvt Ltd).
- You must provide business PAN numbers, bank current accounts, and fully compliant website policies (Terms, Refund Policy, Contact Us pages) before the gateway will activate your production Secret Key.

## Critical Security Foundations

Handling other people's money requires absolute adherence to rigorous security practices:

- **PCI-DSS Compliance**: The Payment Card Industry Data Security Standard dictates that your servers must never see, store, or process raw credit card numbers. You achieve compliance by utilizing Tokenization via the gateway’s client-side library.

- **Asymmetric Key Separation**: You will get two types of API keys from your gateway dashboard
  1. Publishable Key (Safe to expose on client side)
  2. Secret Key (Must be securely stored)

> Publishable key resides safely on your frontend, while the secret key must live strictly in your server-side `.env` file

- **Webhook Signature Verification**: Attackers can spoof incoming network requests to your backend claiming an order was paid. Your Node.js application must cryptographically verify the signature header on incoming webhooks using your gateway's secret hashing method before marking anything as fulfilled.

- **Server-Side Validation**: Never trust the payment amount passed from the client-side UI. Always calculate or verify pricing logic server-side inside your Node.js backend before asking the gateway to generate a payment ticket.
