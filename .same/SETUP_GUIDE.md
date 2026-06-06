# Integration Setup Guide

## 1. Resend Email Setup (Email Verification)

### Step 1: Create a Resend Account
1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address

### Step 2: Get Your API Key
1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it "Sanative Production" (or "Sanative Development" for testing)
4. Copy the API key (starts with `re_`)

### Step 3: Add to Environment Variables
Add to your `.env` file:
```env
RESEND_API_KEY=re_your_api_key_here
```

### Step 4: (Optional) Add Custom Domain
By default, emails will be sent from `onboarding@resend.dev` (Resend's test domain).

To use your own domain (e.g., `noreply@sanative.com.au`):
1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter `sanative.com.au`
4. Add the DNS records Resend provides to your domain
5. Wait for verification (usually 5-30 minutes)
6. Update `.env`:
```env
EMAIL_FROM=noreply@sanative.com.au
EMAIL_FROM_NAME=Sanative Health
```

### Testing
The mock mode (no API key) logs verification codes to the server console.
With the API key, emails are sent in real-time.

---

## 2. Cal.com Setup (Consultation Booking)

### Step 1: Create a Cal.com Account
1. Go to [cal.com](https://cal.com) and sign up
2. Complete your profile setup

### Step 2: Create the Event Type
1. In Cal.com dashboard, go to **Event Types**
2. Click **+ New Event Type**
3. Configure as follows:

| Setting | Value |
|---------|-------|
| **Title** | Initial Consultation |
| **URL** | `initial-consultation` |
| **Duration** | 60 minutes |
| **Description** | Your initial consultation with a Sanative Care Partner to discuss your health goals and create your personalised protocol. |

### Step 3: Configure Event Settings
1. **Availability**: Set your working hours (e.g., 9am-8pm AEST)
2. **Booking frequency**:
   - Minimum notice: 2 hours
   - Buffer between bookings: 15 minutes
3. **Questions**: Add any intake questions (optional)
4. **Confirmation**: Enable email confirmations
5. **Calendar**: Connect your Google/Outlook calendar

### Step 4: Get Your Username
Your Cal.com username is in your profile URL: `cal.com/YOUR_USERNAME`

### Step 5: Update Environment Variables
```env
NEXT_PUBLIC_CALCOM_USERNAME=your_username
NEXT_PUBLIC_CALCOM_EVENT_SLUG=initial-consultation
```

### Step 6: (Optional) Set Up Webhooks
To sync bookings with your database:

1. In Cal.com, go to **Settings** → **Developer** → **Webhooks**
2. Click **+ New Webhook**
3. Configure:
   - **Subscriber URL**: `https://your-domain.com/api/cal-webhook`
   - **Events**: Select `BOOKING_CREATED`, `BOOKING_CANCELLED`, `BOOKING_RESCHEDULED`
4. Copy the **Webhook Secret**
5. Add to `.env`:
```env
CALCOM_WEBHOOK_SECRET=your_webhook_secret
```

### Testing the Embed
The Cal.com embed will automatically appear in the booking step of checkout.
If it fails to load, a fallback link opens Cal.com in a new tab.

---

## 3. Quick Setup Checklist

### Minimum Setup (Testing)
- [ ] Resend API key (free tier: 100 emails/day)
- [ ] Cal.com account with `initial-consultation` event

### Full Production Setup
- [ ] Resend API key with verified domain
- [ ] Cal.com with calendar integration
- [ ] Cal.com webhook for booking sync
- [ ] Custom email templates (already included)

---

## 4. Environment Variables Summary

```env
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@sanative.com.au
EMAIL_FROM_NAME=Sanative Health

# Calendar (Cal.com)
NEXT_PUBLIC_CALCOM_USERNAME=sanative
NEXT_PUBLIC_CALCOM_EVENT_SLUG=initial-consultation
CALCOM_WEBHOOK_SECRET=cal_xxxxxxxxxxxx

# SMS (Twilio) - Optional
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxx
TWILIO_PHONE_NUMBER=+61xxxxxxxxx
```

---

## 5. Testing the Flow

1. Start the dev server: `bun run dev`
2. Navigate to `/membership/checkout`
3. Enter your email and click "Send verification code"
4. Check your email (or server console if using mock mode)
5. Enter the code to verify
6. Complete the checkout flow
7. In the booking step, select a time from Cal.com
8. Confirm the booking appears in Cal.com dashboard
