# Integration Setup Guide

## 1. Email Setup (Google Workspace SMTP, Resend fallback)

Outbound mail goes through `src/lib/email.ts`. Google Workspace SMTP is the target
transport; Resend stays as fallback until Workspace is proven, then it can be removed.

### Workspace credentials (required for Gmail send)
1. In Google Admin: Apps → Google Workspace → Gmail → Routing → SMTP relay service.
   Allow SMTP AUTH, require TLS, allow sending from `sanative.com.au`.
2. Create a mailbox used only for app send. Testing uses `info@sanative.com.au`; production can stay `noreply@sanative.com.au`.
3. Enable 2-Step Verification on that mailbox, then create an **App Password**.
4. Add env vars (SMTP password never goes in the database):

```env
EMAIL_PROVIDER=google_workspace
EMAIL_FROM=info@sanative.com.au
EMAIL_FROM_NAME=Sanative Health
GOOGLE_SMTP_USER=info@sanative.com.au
GOOGLE_SMTP_PASS=xxxx-xxxx-xxxx-xxxx
GOOGLE_SMTP_HOST=smtp.gmail.com
GOOGLE_SMTP_PORT=587
RESEND_API_KEY=re_keep_until_cutover
```

From names per function (auth, membership, stripe, bookings, clinical, marketing, crm)
are edited in **Admin → Email settings**. Blank From uses `EMAIL_FROM`.

### Rollback
1. Set `EMAIL_PROVIDER=resend` (or unset it) and keep `RESEND_API_KEY`.
2. Redeploy. All existing send call sites keep working.
3. Do not remove Resend until a Workspace test from `/admin/email-settings` succeeds
   in production, including a verification-code send.

### Testing
Locally, missing SMTP + missing Resend logs mail to the console (`dev-mode-no-send`).
Production never fakes a successful OTP send.

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
- [ ] Email via Resend (`EMAIL_PROVIDER=resend`) or Workspace SMTP
- [ ] Cal.com account with `initial-consultation` event

### Full Production Setup
- [ ] Google Workspace SMTP relay + App Password
- [ ] `EMAIL_PROVIDER=google_workspace` after a successful test send
- [ ] Resend kept until cutover is confirmed, then removed
- [ ] Cal.com with calendar integration
- [ ] Cal.com webhook for booking sync
- [ ] Custom email templates (already included)

---

## 4. Environment Variables Summary

```env
# Email
EMAIL_PROVIDER=google_workspace
EMAIL_FROM=info@sanative.com.au
EMAIL_FROM_NAME=Sanative Health
GOOGLE_SMTP_USER=info@sanative.com.au
GOOGLE_SMTP_PASS=xxxx-xxxx-xxxx-xxxx
GOOGLE_SMTP_HOST=smtp.gmail.com
GOOGLE_SMTP_PORT=587
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Calendar (Cal.com)
NEXT_PUBLIC_CALCOM_USERNAME=sanative
NEXT_PUBLIC_CALCOM_EVENT_SLUG=initial-consultation
CALCOM_WEBHOOK_SECRET=cal_xxxxxxxxxxxx

# SMS (Cellcast) - Optional
SMS_PROVIDER=cellcast
CELLCAST_API_KEY=xxxxxxx
CELLCAST_SENDER_ID=Sanative
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
