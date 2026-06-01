# Stripe Weight Management Setup Guide

## Overview

This guide explains how to create the required Stripe products and prices for the Sanative Weight Management program with the new two-plan structure.

## Plans to Create

| Plan | First Month | Ongoing | Discount |
|------|-------------|---------|----------|
| **Sanative Core** | $249 | $349/month | $100 off |
| **Sanative Precision** | $399 | $499/month | $100 off |

---

## Step-by-Step Instructions

### 1. Log into Stripe Dashboard

Go to [https://dashboard.stripe.com](https://dashboard.stripe.com) and log in.

Make sure you're in the correct mode:
- **Test Mode** for development (toggle in top right)
- **Live Mode** for production

---

### 2. Create Products

Go to **Products** → **Add product**

#### Product 1: Sanative Core

**Product Details:**
- **Name:** `Sanative Core - Weight Management`
- **Description:** `Doctor-led metabolic weight management program. Includes treatment if prescribed, biomarker monitoring, Health Age tracking, and ongoing clinical support.`
- **Image:** Upload Sanative logo (optional)

**Add Two Prices:**

**Price A - First Month (One-time):**
- Click **Add another price**
- **Pricing model:** One time
- **Price:** `249.00`
- **Currency:** `AUD`
- **Tax behavior:** `Exclusive` (or as per your tax setup)
- **Price description:** `First month - includes $100 introductory discount`
- Click **Save**
- 📝 **Copy the Price ID** (starts with `price_...`)

**Price B - Monthly Recurring:**
- Click **Add another price**
- **Pricing model:** Recurring
- **Price:** `349.00`
- **Currency:** `AUD`
- **Billing period:** `Monthly`
- **Price description:** `Monthly subscription after first month`
- Click **Save**
- 📝 **Copy the Price ID** (starts with `price_...`)

---

#### Product 2: Sanative Precision

**Product Details:**
- **Name:** `Sanative Precision - Weight Management`
- **Description:** `Enhanced doctor-led metabolic weight management with closer clinical monitoring, more frequent follow-ups, and priority support.`
- **Image:** Upload Sanative logo (optional)

**Add Two Prices:**

**Price A - First Month (One-time):**
- Click **Add another price**
- **Pricing model:** One time
- **Price:** `399.00`
- **Currency:** `AUD`
- **Tax behavior:** `Exclusive`
- **Price description:** `First month - includes $100 introductory discount`
- Click **Save**
- 📝 **Copy the Price ID** (starts with `price_...`)

**Price B - Monthly Recurring:**
- Click **Add another price**
- **Pricing model:** Recurring
- **Price:** `499.00`
- **Currency:** `AUD`
- **Billing period:** `Monthly`
- **Price description:** `Monthly subscription after first month`
- Click **Save**
- 📝 **Copy the Price ID** (starts with `price_...`)

---

### 3. Add Environment Variables

Add these to your `.env` file (or Vercel environment variables):

```bash
# Stripe Weight Management Price IDs
STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID=price_xxxxxxxxxxxxxxxx
STRIPE_WM_CORE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxx
STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID=price_xxxxxxxxxxxxxxxx
STRIPE_WM_PRECISION_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxxxxx
```

Replace `price_xxxxxxxxxxxxxxxx` with the actual Price IDs you copied from Stripe.

---

### 4. Configure Webhook (if not already done)

Go to **Developers** → **Webhooks** → **Add endpoint**

**Endpoint URL:**
```
https://your-domain.com/api/webhooks/stripe
```

**Events to listen for:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

📝 **Copy the Webhook Signing Secret** and add to your `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

---

## Testing

### Test Mode Price IDs

For development/testing, create the same products in **Test Mode** and use those Price IDs in your development environment.

### Test Card Numbers

| Card | Number | Use Case |
|------|--------|----------|
| Visa (Success) | `4242 4242 4242 4242` | Successful payment |
| Visa (Decline) | `4000 0000 0000 0002` | Card declined |
| 3D Secure | `4000 0025 0000 3155` | Requires authentication |

Use any future expiry date and any 3-digit CVC.

---

## Verification Checklist

- [ ] Created "Sanative Core" product with 2 prices ($249 one-time, $349 recurring)
- [ ] Created "Sanative Precision" product with 2 prices ($399 one-time, $499 recurring)
- [ ] Copied all 4 Price IDs
- [ ] Added environment variables to `.env`
- [ ] Added environment variables to Vercel (for production)
- [ ] Webhook endpoint configured
- [ ] Tested payment flow in Test Mode

---

## Environment Variable Reference

```bash
# Required Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxx (or sk_test_xxxx for testing)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxx (or pk_test_xxxx for testing)
STRIPE_WEBHOOK_SECRET=whsec_xxxx

# Weight Management Plans
STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID=price_xxxx
STRIPE_WM_CORE_MONTHLY_PRICE_ID=price_xxxx
STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID=price_xxxx
STRIPE_WM_PRECISION_MONTHLY_PRICE_ID=price_xxxx
```

---

## Support

If you encounter issues, check:
1. Price IDs are correct (they should start with `price_`)
2. You're using the correct mode (Test vs Live)
3. Webhook is receiving events (check Stripe Dashboard → Developers → Webhooks → Logs)
