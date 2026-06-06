# Sanative Weight Management - Todo Tracking

## Completed ✅

### Version 677 - Fix Quiz Data Not Showing in Admin for Alternative Email Users ✅
- [x] **Root cause identified**: Early user creation at EmailGate (step 6) created ProgramMember with minimal data
  - Step 6: Creates User + ProgramMember with only email, firstName, currentWeight, height, weightLossGoal
  - Steps 8-17: User completes full quiz (conditions, medications, motivations, etc.)
  - Step 19: Calls intake again, but user exists → only WeightManagementIntake was updated
  - Admin API reads from ProgramMember.intakeData → showed incomplete data
- [x] **Fix applied**: Intake API now updates ProgramMember.intakeData when full quiz is submitted
  - Added logic after WeightManagementIntake update to also update ProgramMember
  - Merges existing intakeData with new quiz data (preserves early data, adds new fields)
  - Non-blocking: if ProgramMember update fails, WeightManagementIntake still has backup
- [x] Admin customer form now shows complete quiz results for all users
- [x] Linter passing

### Version 664 - PCOS Biomarker Testing & Booking Flow ✅
- [x] **Added dedicated PCOS & Hormone Panel on `/labs` page**
  - Featured panel with rose/purple gradient
  - "Popular" badge to highlight it
  - Lists key biomarkers: Fasting Insulin, HOMA-IR, Testosterone, DHEA-S, LH, FSH, SHBG, HbA1c, Glucose, Thyroid
  - Links to PCOS booking flow at `/metabolic-care/pcos/book?panel=pcos`
  - Price: $199 one-time
- [x] **Connected quiz results to lab test recommendations**
  - Quiz calculates risk score (0-18) based on 6 questions
  - Risk levels: Low (0-4), Moderate (5-9), High (10+)
  - After quiz completion, shows recommended panels:
    - Metabolic Health Panel (HbA1c, Glucose, Insulin, HOMA-IR)
    - Hormone Balance Panel (Testosterone, DHEA, Estrogen, Cortisol)
  - CTA buttons link to labs page and booking flow
- [x] **Created PCOS appointment booking flow at `/metabolic-care/pcos/book`**
  - Step 1: Panel selection (PCOS, Metabolic, or Hormone panel)
  - Step 2: Date/time/location selection
    - Shows next 14 days (excludes Sundays)
    - 16 time slots from 8:00 AM to 4:30 PM
    - 5 collection centre locations
  - Step 3: Personal details form
    - Name, email, phone, DOB
    - Health concerns textarea
    - Optional doctor consultation add-on (+$49)
  - Booking confirmation screen with next steps
- [x] Linter passing (pre-existing warnings in other files)

### Version 663 - PCOS & Metabolic Health Page ✅
- [x] **Created comprehensive PCOS page at `/metabolic-care/pcos`**
  - Hero section with overview of PCOS and metabolic connection
  - Stats section with PCOS prevalence data
  - Interactive PCOS Risk Assessment Quiz (6 questions)
  - Risk factors and symptoms sections
  - "The Metabolic Connection" explainer section
  - "Our Approach to PCOS Care" process steps
  - Key biomarkers section with recommended panels
  - Nutrition tips for PCOS management
  - CTA section linking to biomarker testing
  - FAQ section with 6 comprehensive Q&As
  - Medical disclaimer
- [x] **Identified relevant biomarker panels**:
  - Metabolic Health Panel (HbA1c, Fasting Glucose, Insulin, HOMA-IR)
  - Hormone Balance Panel (Testosterone, DHEA, Estrogen, Cortisol)
- [x] **Quiz features**:
  - 6 questions about PCOS symptoms and risk factors
  - Progress indicator
  - Score-based risk assessment (Low/Moderate/High)
  - Personalized recommendations based on score
  - CTAs to biomarker testing after quiz completion
- [x] **Updated metabolic-care page**:
  - PCOS card now shows as available (was `available: false`)
  - Updated card color to rose/purple gradient
- [x] Fixed TypeScript error in staff route
- [x] Linter passing (pre-existing warnings in other files)

### Version 662 - Fixed Staff API Prisma Error ✅
- [x] **Fixed Prisma error in Staff API**:
  - Identified missing `userId` field in `User` model
  - Added `userId` to `User` model in Prisma schema
  - Updated Staff API to use `userId` field
  - Fixed staff count query to properly handle user relationships
  - Staff page now correctly shows staff count and user info
- [x] **Updated Staff page**:
  - Fixed display of staff count and user information
  - Added proper error handling for missing user data
  - Improved console logging for debugging
- [x] Linter passing

### Version 660 - Staff Management Debug Logging ✅
- [x] **Added session debug endpoint `/api/admin/debug-session`**
  - Returns session info and database user info for comparison
  - Helps diagnose role mismatches between session and database
- [x] **Added console logging to Staff API**
  - Logs session details on each request
  - Logs role check results
  - Logs staff count query results
  - Easy to see in server console what's happening
- [x] **Updated Staff page with debug info**
  - Shows session debug info when access is denied
  - Console logs session and API response data
  - Helpful instructions when access is denied
- [x] **Issue Investigation Notes**:
  - Database confirmed to have 7 staff users (1 admin, 5 doctors, 1 care partner)
  - Admin user exists: admin@sanative.com.au with role ADMIN
  - If user sees empty list, possible causes:
    1. Session cached from previous non-admin login
    2. Session not properly synced after login
    3. User needs to log out completely and log back in
- [x] Linter passing

### Version 659 - Doctor Profile Enhancement ✅
- [x] **Enhanced doctor dashboard with unified calendar support**
  - Doctors can now see consultations assigned during triage
  - Added "My Patients" tab showing all patients assigned to doctor
  - Added "Care Comms" tab for viewing care communication tasks
  - Added patient statistics overview (5 metrics)
  - Support for unified slot system where doctor is assigned post-booking
- [x] **Created `/api/admin/doctor/my-patients` API endpoint**
  - Returns patients assigned to the logged-in doctor
  - Includes care communications for those patients
  - Returns patient stats (total, active, pending, approved, declined)
- [x] Linter passing

### Version 658 - Unified Calendar Fix (No Slot Duplication) ✅
- [x] **Fixed calendar slot duplication during booking**
  - Slots were showing 3 times (once per doctor) - now shows ONE slot per time
  - Doctor assignment happens during triage by care partner
- [x] **Updated `/api/bookings/availability`**:
  - Changed from per-doctor slots to unified slots
  - New slot format: `slot_unified_<timestamp>` (doctor-agnostic)
  - Added `availableDoctors` count for capacity tracking
  - `availabilityStatus` now shows "AVAILABLE" or "LIMITED" based on capacity
- [x] **Updated `/api/bookings/hold`**:
  - Now creates bookings WITHOUT doctor assignment
  - Doctor field is null until assigned during triage
  - Supports both unified and legacy slot ID formats for backwards compatibility
  - Tracks available capacity across all doctors
- [x] **Updated assessment page**:
  - Removed `selectedDoctorId` and `selectedDoctorName` from form data
  - Updated slot types from `AvailableSlot` to `UnifiedSlot`
  - Booking screen now shows "Doctor assigned by care team" instead of doctor name
  - Slot selection no longer sets doctor fields
- [x] **Added `ASSIGN_DOCTOR_TO_BOOKING` action to triage API**:
  - Care partners can now assign doctors to bookings during triage
  - Validates doctor availability at the scheduled time
  - Creates internal notes and activity logs
- [x] Linter passing

### Version 653 - Doctor Decision Prescription Fix ✅
- [x] **Fixed prescription linking in doctor decision route**
  - After APPROVED decision, prescriptionId is now correctly set on WeightManagementIntake
  - Handles both new and existing prescriptions
  - Ensures scriptStatus is updated and tracked
- [x] **Updated journey status API**:
  - Returns prescription data in journey status response
  - Includes scriptStatus, pharmacy info, shipping tracking, refill status
- [x] **Portal treatment page updated**:
  - Shows prescription timeline and status
  - Displays shipping tracking and refill info
  - Refresh button for status updates
- [x] Linter passing

### Version 652 - Duplicate Email Warning in Quiz ✅
- [x] **Created `/api/auth/check-email` endpoint**
  - Checks if email exists in database
  - Returns `exists`, `hasActiveProgram`, `journeyStatus`, `firstName`
  - Used by quiz to detect duplicate emails
- [x] **Updated `EmailGateWithGraph` component** with duplicate check:
  - Checks email before proceeding to next step
  - Shows warning modal when email already exists
  - Options: "Log in to your portal", "Use a different email", "Contact us"
  - Personalized message if we know their first name
- [x] **Root cause identified**: Using existing email updates existing user instead of creating new one
- [x] Users now clearly informed when email is already registered
- [x] Linter passing

### Version 651 - Reverted Magic Link Changes & Investigation ✅
- [x] **Reverted magic link URL changes** from version 650
  - User reported customer creation issue - investigated
  - Changes were only to magic link URL (happens AFTER customer creation)
  - Could not have caused customer creation failure
- [x] **Verified system is working correctly**:
  - Tested intake API with curl - user created successfully
  - Database shows users being created properly
  - Admin customers API returns users correctly
- [x] **Root cause of "David Davis" issue**: User used existing email - system updated existing record
- [x] Linter passing, system functional

### Magic Link Portal Access After Payment (Version 649) ✅
- [x] **Booking confirm route generates magic link** for portal access
  - Uses `sign()` from jsonwebtoken to create 7-day valid token
  - Token includes userId, email, and purpose ("magic_login")
- [x] **Confirmation email includes magic link** instead of direct dashboard link
  - "Access My Portal" button uses magic link URL
  - Added note about link validity (7 days)
- [x] **Thank you screen uses magic link** for portal access
  - Button dynamically shows "Access my portal" when magic link is available
  - Falls back to "/dashboard" with guidance to check email if no magic link
- [x] **Response includes magicLink field** for frontend use
  - Assessment page captures magic link from API response
  - Stored in `portalMagicLink` state for thank you screen
- [x] Users can now access portal and set password after payment
- [x] Linter passing (pre-existing `any` type warnings in other files are not related)

### Admin Password Reset on Customer Detail Form (Version 648) ✅
- [x] **Created `/api/admin/users/reset-password` API** (already existed from previous context)
  - Admin-only endpoint for resetting user passwords
  - Generates random secure password if not provided
  - Options to send via email or show to admin for manual sharing
  - Creates internal note and activity log for audit trail
- [x] **Added Reset Password button** to Quick Actions section on customer detail form
  - KeyRound icon with amber styling to indicate sensitive action
  - Opens confirmation dialog before resetting
- [x] **Created password reset dialog** with:
  - Option for custom password or auto-generate
  - Checkbox to email password to customer or not
  - Warning when choosing not to email (admin must share manually)
  - Success state showing generated password when email not sent
  - Password validation (min 8 characters)
- [x] Linter passing

### SMS Provider Integration & Admin Notifications UI (Version 646) ✅
- [x] **Created `src/lib/sms.ts`** - Comprehensive SMS library:
  - Multiple provider support: Twilio, MessageMedia, Cellcast, Mock
  - Phone number formatting for Australian numbers (E.164 and local)
  - Validation for Australian mobile numbers
  - `sendSMS()` - Send immediately via configured provider
  - `queueSMS()` - Queue for background processing
  - `sendAndLogSMS()` - Send and log to database
  - `sendBulkSMS()` - Send multiple messages with rate limiting
  - `processPendingSMS()` - Process pending queue (for cron jobs)
  - `getSMSStats()` - Get SMS statistics
  - `getSMSProviderInfo()` - Get provider configuration status
- [x] **Created `/admin/notifications` page**:
  - Dashboard with SMS stats (sent, pending, failed)
  - Provider status indicator
  - SMS message list with search and filtering
  - Message detail dialog
  - Retry failed messages
  - Pagination support
- [x] **Created `/api/admin/notifications/stats` endpoint** - Get notification statistics
- [x] **Created `/api/admin/notifications/retry` endpoint** - Retry failed notifications
- [x] **Fixed `/api/admin/notifications/route.ts`** - Fixed type errors
- [x] **Added "Notifications" nav item** to admin sidebar
- [x] Linter passing

### UAT8-GAP-013: Email/SMS Not Fully Wired (Version 645) ✅
- [x] **Booking confirmation email wired up**:
  - `sendConfirmationEmail()` now uses `sendEmail()` from `@/lib/email`
  - Professional HTML email with appointment details, next steps, and dashboard link
  - Includes: date/time, doctor name, plan type, what happens next
  - Warning about having phone available
- [x] **Booking confirmation SMS wired up**:
  - `sendConfirmationSMS()` now creates `SMSNotification` record
  - Queued for processing by SMS API
  - Message includes: date/time, doctor name, opt-out
- [x] **Updated webhook wording**:
  - Changed `"Membership Consultation"` → `"Weight Management Program"` in invoice description
  - Changed `"consultation fee has been received"` → `"payment has been received"` in magic link email
  - Changed `"we'll be in touch to schedule your initial consultation"` → `"check your inbox for consultation confirmation details"`
- [x] Linter passing

### UAT8-GAP-010: Fix Conflicting $50 Promo Language (Version 644) ✅
- [x] **Identified conflict**: Intro offer popup said "Save $50" but pricing shows $100 discount
- [x] **Set `showIntroOffer` to `false`** by default (disabled the popup)
- [x] **Removed popup JSX** and replaced with explanatory comment
- [x] **Pricing is now consistent**:
  - Core: $349 → $249 (save $100)
  - Precision: $499 → $399 (save $100)
- [x] Legacy $50 code in `handleSubmit_LEGACY_DEAD_CODE` is clearly marked as dead code
- [x] Linter passing

### UAT8-GAP-010: Legacy Payment Paths Review (Version 643) ✅
- [x] **Reviewed all assessment pages for legacy $49 payment paths**
- [x] **Weight Management** (`src/app/(public)/weight-management/assessment/page.tsx`):
  - Legacy $49 path marked as DEAD CODE (UAT8-GAP-009)
  - Now uses $249/$399 first-month model with booking system
  - `handleSubmit_LEGACY_DEAD_CODE` function preserved but redirects to booking step
- [x] **Men's Health** (`src/app/(public)/mens-health/assessment/page.tsx`):
  - Still uses $49 consultation model (intentional for this program)
  - Creates PaymentIntent for 4900 cents and redirects to /payment
  - **No change needed** - different program model
- [x] **Women's Health** (`src/app/(public)/womens-health/assessment/page.tsx`):
  - Still uses $49 consultation model (intentional for this program)
  - Creates PaymentIntent for 4900 cents and redirects to /payment
  - **No change needed** - different program model
- [x] **Hair Loss** (`src/app/(public)/hair-assessment/page.tsx`):
  - Still uses $49 consultation model (intentional for this program)
  - Creates PaymentIntent for 4900 cents and redirects to /payment
  - **No change needed** - different program model
- [x] **Fatty Liver** (`src/app/metabolic-care/fatty-liver/assessment/page.tsx`):
  - Still uses $49 consultation model (intentional for this program)
  - Redirects to /payment with amount param
  - **No change needed** - different program model
- [x] **Legacy /payment page** (`src/app/payment/page.tsx`):
  - Still active and used by non-Weight-Management programs
  - Should NOT be deleted - required for Mens/Womens/Hair/Liver programs
  - Weight Management now bypasses this page
- [x] **Intake API** (`src/app/api/intake/route.ts`):
  - Has PROGRAM_CONFIG with `consultationAmount: 4900` for all programs
  - This is correct - programs other than Weight Management use this
  - Weight Management ignores this field (uses StripePaymentForm directly)

**Summary:** Only Weight Management uses the new $249/$399 subscription model.
Other programs intentionally use the $49 consultation fee model.
No changes required for other programs at this time.

### UAT8-GAP-009: Stale $49 Payment Path Fixed (Version 642) ✅
- [x] **assessment/page.tsx**: Identified legacy $49 payment path as dead code
  - Old `handleSubmit` function created $49 PaymentIntent and redirected to /payment
  - Called from `BiomarkerSnapshot` in switch `default` case
  - `default` case is unreachable: steps 1-17 handled by switch cases, 18-23 by if statements
- [x] **Gentle fix applied** (no forms deleted):
  - Renamed function to `handleSubmit_LEGACY_DEAD_CODE` with warning comments
  - Function now logs error and redirects to step 20 (booking) instead of running legacy code
  - Original code preserved as commented block for reference
  - `default` case now shows loading spinner and redirects to step 20
- [x] All 5 UAT8-GAP-009 tests passing
- [x] Linter passing

### UAT8-GAP-007: Real Google Calendar Integration (Version 641) ✅
- [x] **lib/google-calendar.ts**: Created Google Calendar service library
  - OAuth2 service account authentication
  - `createDoctorCalendarEvent()` - creates event with all patient details
  - `updateCalendarEvent()` - updates existing events
  - `deleteCalendarEvent()` - removes cancelled events
  - `checkCalendarAccess()` - validates calendar permissions
  - Fallback to shared Sanative calendar if doctor calendar fails
  - Never throws - returns detailed result object
- [x] **api/bookings/confirm/route.ts**: Updated to use real Google Calendar API
  - Fetches doctor email for calendar targeting
  - Passes all required fields: patient name, phone, BMI, risk flags, plan, etc.
  - Handles calendar failures gracefully (booking still succeeds)
  - Creates admin exception task if calendar fails
  - Logs calendar event ID on booking record
- [x] **Calendar event includes**: Patient name, phone, appointment time, selected plan,
      appointment type (phone consult), doctor brief URL, payment status, intake ID,
      risk flags, BMI summary
- [x] **Error handling**: Calendar failure creates urgent admin task, booking remains confirmed
- [x] Installed `googleapis@172.0.0` package
- [x] Environment variables: `GOOGLE_CALENDAR_CREDENTIALS`, `GOOGLE_CALENDAR_FALLBACK_ID`
- [x] Linter passing

### UAT8-GAP-006: Approved with testing model + Smoke Tests (Version 640) ✅
- [x] **doctor/decision/route.ts**: Updated `APPROVED_PENDING_TESTS` case to:
  - Create prescription if medication is provided
  - Create ongoing subscription (patient proceeds with program)
  - Set `approvalStatus` to `APPROVED_WITH_TESTS`
  - Set `journeyStatus` to `APPROVED` (not `TESTS_ORDERED`)
  - Track tests via CareCommunication tasks but don't block program
  - Create pathology request task with "monitoring" language
  - Create script finalization task if prescription created
  - Create onboarding task (proceeds immediately)
  - Send approval email with tests info (not blocking language)
- [x] **journey-status/route.ts**: Updated to handle new flow:
  - `STAGE_DESCRIPTIONS` updated: tests statuses now have stage "approved" (not "pending-tests")
  - Added `TESTS_TRACKING_STATUSES` constant
  - `hasTestsTracking` field replaces blocking `pendingTests` logic
  - `testsTrackingInfo` object returns task details for UI
  - `isApproved` now includes `APPROVED_WITH_TESTS` approvalStatus
- [x] **member portal page.tsx**: Updated dashboard to show non-blocking tests tracking:
  - `JourneyStatusData` interface updated with `hasTestsTracking` and `testsTrackingInfo`
  - `getTimelineProgress` function updated: tests statuses map to step 4 (approved)
  - Timeline shows tests as "monitoring" not "blocking"
  - Replaced blocking amber alert with informational blue card
  - Tests tracking card shows progress without blocking messaging
- [x] **smoke.test.ts**: Added 14 new tests for approved-with-testing flow:
  - 8 tests for `UAT8-GAP-006: Approved With Testing Model`
  - 6 tests for `Doctor Decision API Logic`
  - All 36 tests passing
- [x] Linter passing

### UAT8-GAP-004: Fix premature subscription activation (Version 638) ✅
- [x] **api/bookings/confirm/route.ts**: Removed MembershipSubscription creation before doctor approval
- [x] **api/webhooks/stripe/route.ts**: Removed MembershipSubscription upsert on payment success
- [x] Invoice record still created to track first-month payment
- [x] User.journeyStatus set to CONSULTATION_PAID (not ACTIVE)
- [x] User.subscriptionStatus remains INACTIVE until doctor approval
- [x] MembershipSubscription only created in /api/admin/doctor/decision after APPROVED
- [x] Added clear comments explaining the flow
- [x] Linter and typecheck passing

### UAT8-GAP-003: Remove aggressive/unsubstantiated claims (Version 637) ✅
- [x] **ObjectionHandlingSection.tsx**: Removed unsubstantiated statistics (80+ biomarkers, 87%, 78%)
- [x] Removed "same quality as in-person" claim
- [x] Removed "no questions asked" guarantee language
- [x] Replaced with conservative doctor-led process copy
- [x] Updated heading: "Doctor-led care. Your questions answered."
- [x] Replaced testimonials with factual feature cards (AHPRA doctors, privacy, ongoing support)
- [x] Added disclaimer: "Individual results vary. Treatment is only prescribed where clinically appropriate."
- [x] All Q&A answers now focus on process, clinical assessment, and realistic expectations
- [x] Linter passing

### UAT8-GAP-001: Build/schema validation (Version 636) ✅
- [x] **Prisma schema validation**: `npx prisma validate` passes without errors
- [x] **Prisma client generation**: `npx prisma generate` successful
- [x] **TypeScript typecheck**: `npm run typecheck` passes
- [x] **Full build**: `npm run build` compiles successfully
- [x] **Fixed Stripe webhook TypeScript error**: Updated `invoice.subscription` access for API version compatibility
- [x] **Fixed SetNull referential action warning**: Made `MemberMessage.senderId` optional to match `onDelete: SetNull`
- [x] **No duplicate Clinic passwordHash**: Verified `passwordHash` exists correctly in User and Clinic models (separate models)
- [x] Schema is valid and ready for pilot

### UAT6-GAP-019: Remove star ratings (Version 635) ✅
- [x] **WeightLossHero.tsx**: Removed "4.9/5 from Australian patients" star rating
  - Replaced with "Australian doctor-led care" and "Treatment if clinically appropriate"
- [x] **HowItWorksSection.tsx**: Removed "4.9/5 Average rating" → "100% AHPRA-registered"
- [x] **WomensHealthHowItWorks.tsx**: Removed "4.9/5 Patient rating" → "100% AHPRA-registered"
- [x] **VideoTestimonialsSection.tsx**: Removed star ratings from testimonial cards
- [x] **programs/page.tsx**: Removed "4.9/5 Patient satisfaction" → "24/7 Care partner support"
- [x] No public star-rating/review score appears in Weight Management hero or other pages
- [x] Linter passing

### UAT6-GAP-023: Biomarker positioning fix (Version 634) ✅
- [x] **WhyWomenChoose.tsx**: "2 free metabolic biomarker reports" → "Doctor-reviewed biomarker monitoring"
  - Changed description to "Blood tests requested where clinically appropriate"
- [x] **FinalCTASection.tsx**: "2 free metabolic reports included" → "Doctor-reviewed biomarker monitoring where clinically appropriate"
- [x] **hair-health/page.tsx**: "Members get free biomarker testing twice a year" → "Blood tests requested where clinically appropriate"
- [x] **FAQSection.tsx**: Already compliant - "Blood tests are requested only where clinically appropriate by an Australian doctor"
- [x] **ProgramIncludesSection.tsx**: Already compliant - uses "doctor-reviewed biomarker insights"
- [x] Biomarker language is now conditional, doctor-led and plan-specific
- [x] Linter passing

### UAT6-GAP-024: Remove unsupported insurance claims (Version 633) ✅
- [x] **WomensHealthFAQ.tsx**: Removed "itemised invoices...submit to insurer for potential rebates"
  - Replaced with "Some patients may be able to claim part of eligible services depending on their cover. Please check directly with your insurer."
- [x] **womens-health/assessment/page.tsx**: "Rebates may apply" → "Check with your insurer"
- [x] **womens-health/book/page.tsx line 242**: "Rebates may apply" → "Check with your insurer"
- [x] **womens-health/book/page.tsx line 578**: "You may be eligible for a rebate through your private health insurance" → "Some patients may be able to claim part of eligible services. Check with your insurer."
- [x] **weight-loss/FAQSection.tsx**: Already compliant (no changes needed)
- [x] No insurer list or unsupported claimability promise remains
- [x] Linter passing

### UAT6-GAP-026: Remove "No commitment" wording (Version 632) ✅
- [x] **FinalCTASection.tsx**: "No commitment upfront" → "Refund if not clinically suitable"
- [x] **CTASection.tsx**: "No commitment required" → "Refund if not clinically suitable"
- [x] **mens-health/erectile-dysfunction/page.tsx**: "No commitment" → "Refund if not suitable"
- [x] **mens-health/page.tsx**: "No commitment" → "Refund if not suitable"
- [x] **hair-health/page.tsx**: "No commitment" → "Refund if not suitable"
- [x] **metabolic-care/fatty-liver/page.tsx**: "No commitment" → "Refund if not suitable"
- [x] **metabolic-care/page.tsx**: "No commitment" → "Refund if not suitable"
- [x] **labs/page.tsx**: Left as-is - "No commitment to any program" refers to standalone lab tests (different context)
- [x] No misleading "no commitment" copy appears where payment is required
- [x] Linter passing

### UAT6-GAP-027: Remove TGA-compliant medications wording (Version 631) ✅
- [x] **FinalCTASection.tsx line 146**: Replaced "TGA-compliant medications" with "Treatment if clinically appropriate"
- [x] Verified no other instances of "TGA-compliant medications" in codebase
- [x] No implied regulatory endorsement language remains
- [x] Linter passing

### UAT6-GAP-017: Remove Public Medicine Terms (Version 630) ✅
- [x] **FinalCTASection.tsx**: Removed "Semaglutide" from clinical citation disclaimer
  - Replaced with "peer-reviewed clinical studies published in N Engl J Med"
  - Added note: "Specific treatment options are discussed privately with your Sanative doctor"
- [x] **fatty-liver/page.tsx**: Removed all public medication names:
  - Line 161: "semaglutide in clinical trial" → "prescription treatment in clinical trial"
  - Line 164: "GLP-1 clinical trials" → "prescription medication clinical trials"
  - Line 181: "GLP-1 receptor agonists" → "prescription medications... discussed privately with your doctor"
  - Line 213: "GLP-1 receptor agonists" → "prescription medications... discussed privately with your doctor"
  - Line 639: Removed medication name from reference citation title
- [x] **Verified clean**: services/page.tsx, WeightLossSection.tsx, TreatmentsSection.tsx already compliant (GAP-022)
- [x] **Verified clean**: weight-management/assessment/page.tsx has no medication names
- [x] **Admin pages**: Kept medication references (internal clinical use only, behind authentication)
- [x] No GLP-1/Ozempic/Wegovy/Mounjaro/semaglutide/tirzepatide in public funnel
- [x] Linter passing

### Stripe Webhook for Subscription Payment Failures (Version 629) ✅
- [x] Enhanced `handleInvoicePaymentFailed` webhook handler with:
  - Update User `subscriptionStatus` to INACTIVE on payment failure
  - Update `MembershipSubscription` status to PAST_DUE
  - Create Invoice record for failed payment
  - Create care communication task for care partner follow-up
  - Create internal note for admin visibility
  - Log to AutomationLog for audit trail
  - Send email notification to patient with payment update link
  - Send SMS reminder for repeat failures (attempt >= 2)
  - Track retry attempts and next retry date
- [x] Added `handleChargeRefunded` webhook handler:
  - Update user journey status from REFUND_PENDING to REFUNDED
  - Create negative invoice record for refund
  - Create internal note documenting refund
  - Send refund confirmation email
  - Log automation event
- [x] Added `handleSubscriptionPaused` webhook handler:
  - Update membership and user status to paused
  - Create care communication task for follow-up
  - Create internal note
  - Send pause notification email
  - Log automation event
- [x] Database migration verified (prescriptionId field synced)
- [x] Linter passing

### Prescription/Pharmacy Linking Verification (Version 628) ✅
- [x] Added `prescriptionId` field to `WeightManagementIntake` model in Prisma schema
- [x] **Treatment API**: Updated `/api/weight-management/treatment` to fetch from `Prescription` model instead of `Treatment` model
  - Now shows actual doctor-prescribed medications with scriptStatus
  - Includes pharmacy info, shipping tracking, refill status
  - Removed POST/PUT endpoints (GAP-021: patients cannot self-add medications)
- [x] **Journey Status API**: Updated `/api/weight-management/journey-status` to include:
  - Actual prescription data (id, scriptStatus, pharmacy, prescriber)
  - Shipping tracking info (trackingNumber, isShipped, isDelivered)
  - WeightManagementIntake data for comprehensive status
  - effectiveStatus that combines journey and script status for timeline
- [x] **Doctor Decision Route**: After APPROVED decision, now links prescription to WeightManagementIntake:
  - Sets `prescriptionId`, `doctorReviewStatus`, `doctorId`, `doctorReviewedAt`, `doctorDecision`, `doctorNotes`
- [x] **Doctor Decision Route**: APPROVED_NO_TREATMENT also updates intake with doctor decision
- [x] **Portal Treatment Page**: Updated to use new API response format:
  - Shows prescription scriptStatus and timeline
  - Displays shipping tracking when available
  - Shows refill status and availability
  - Refresh button for status updates
- [x] Ran `prisma generate` to update client
- [x] Linter passing

### UAT6-GAP-005: Subscription Billing After Doctor Approval (Version 627) ✅
- [x] Created `createOngoingSubscription()` helper function in doctor decision route
- [x] After APPROVED decision: Create Stripe subscription for Core ($349/mo) or Precision ($499/mo)
- [x] After APPROVED_NO_TREATMENT decision: Also create subscription (lifestyle program still billed)
- [x] Subscription starts billing 30 days after first payment (billing anchor set)
- [x] If subscription creation fails, creates BILLING task for manual setup
- [x] DECLINED decision: No subscription created, refund initiated
- [x] APPROVED_PENDING_TESTS: No subscription until final approval after tests
- [x] Gets `selectedPlan` from ConsultationBooking record
- [x] Uses Stripe Price IDs if configured, falls back to inline pricing
- [x] Logs subscription creation to ActivityLog and InternalNote
- [x] Response includes `subscriptionCreated`, `subscriptionId`, `monthlyAmount`
- [x] Linter passing

### GAP-009+: Durable Weight Management Intake Records (Version 626) ✅
- [x] **Verified Weight Management quiz submission creates durable records**
- [x] Created `WeightManagementIntake` record for both new and existing users
- [x] Linked `WeightManagementIntake.userId` to `User` (Patient) record
- [x] Linked `WeightManagementIntake.programMemberId` to `ProgramMember` (ProgramEnrollment) record
- [x] Linked `WeightManagementIntake.bookingId` to `ConsultationBooking` record
- [x] Properly tracking:
  - Patient ID (`userId`)
  - Intake ID (`intakeId`)
  - ProgramEnrollment ID (`programMemberId`)
  - Selected plan (`selectedPlan`: CORE/PRECISION)
  - Payment status (`paymentStatus`: UNPAID/PENDING/PAID/REFUNDED/FAILED)
  - Booking status (`bookingStatus`: NOT_BOOKED/SLOT_HELD/CONFIRMED/etc)
  - Doctor review status (`doctorReviewStatus`: PENDING_TRIAGE/AWAITING_DOCTOR/APPROVED/etc)
  - Portal status (`portalStatus`: INTAKE_STARTED/INTAKE_COMPLETED/TREATMENT_ACTIVE/etc)
- [x] **No duplication**: If portal customer already exists, updates and links existing records
- [x] API response now returns all linked IDs in `links` object
- [x] Added `parseConsultationDateTime` helper to avoid code duplication
- [x] Linter passing

### UAT6-GAP-009: Booking Availability Fix (Version 623) ✅
- [x] Removed Math.random() slot generation from src/lib/availability.ts
- [x] Created DoctorAvailability model in Prisma schema for roster-based scheduling
- [x] Created DoctorBlockedDate model for doctor holidays/leave
- [x] Updated /api/bookings/availability to use database-backed roster
- [x] Added double-booking prevention via slot hold/expiry checks
- [x] Deprecated generateAvailableDates() and generateTimeSlots() functions
- [x] Added new helper functions: fetchAvailability(), groupSlotsByDay(), formatSlotTime()
- [x] Fallback to Thu/Fri/Sat 9am-7pm if no roster configured
- [x] Created migration SQL for new tables
- [x] Only rostered doctors and real slots now appear
- [x] Double-booking is blocked via existing booking/hold checks
- [x] Created admin API /api/admin/doctor-roster with full CRUD:
  - GET: List all doctor schedules and blocked dates
  - POST: Create availability slots or blocked dates
  - POST (BULK_CREATE_SCHEDULE): Replace entire weekly schedule
  - PATCH: Update availability or blocked date
  - DELETE: Remove availability or blocked date
- [x] Created seed endpoint /api/admin/doctor-roster/seed:
  - GET: Check which doctors need schedules
  - POST: Auto-seed default Thu/Fri/Sat 9am-7pm schedules
  - Supports custom schedules and selective seeding
- [x] **Applied database migration** via `prisma db push`
- [x] **Created admin UI page** /admin/doctor-roster with:
  - Dashboard stats (total doctors, scheduled, slots, blocked)
  - Expandable doctor cards showing availability and blocked dates
  - Add Availability modal (day, time, duration, status)
  - Block Date modal (date, reason)
  - Quick "Seed Default Schedules" button for all doctors
  - Delete availability and blocked dates
  - Real-time refresh

### UAT6-GAP-008: Booking Admin Security (Version 620) ✅
- [x] Added admin authentication middleware to booking admin endpoints
- [x] Restricted booking management APIs to admin/doctor roles
- [x] Added audit logging for booking changes
- [x] Updated admin portal to show booking audit history

### UAT6-GAP-007: Booking Persistence Fix (Version 619) ✅
- [x] Migrated src/lib/bookings.ts from in-memory Map to Prisma database
- [x] Now uses ConsultationBooking model for all booking operations
- [x] Bookings survive server restart/deploy
- [x] Added status mapping between legacy strings and BookingStatus enum
- [x] Added helper functions for admin/doctor portal queries:
  - getBookingsByStatus()
  - getUpcomingBookings(startDate, endDate)
  - getBookingsByDoctor(doctorId)
- [x] Maintains backward compatibility with existing Booking interface
- [x] Includes patient, intake, slot, payment, status and audit fields

### UAT6-GAP-004: Stripe Payment Configuration Fix (Version 618) ✅
- [x] Added WEIGHT_MANAGEMENT_PRICES constant to src/lib/stripe.ts with Core/Precision pricing
- [x] Updated StripePaymentForm to accept bookingHoldId and intakeId props
- [x] Updated /api/stripe/subscription to include in metadata:
  - selectedPlan (core/precision)
  - intakeId (for intake tracking)
  - bookingHoldId (for booking tracking)
  - journeyStatus (Weight Management journey status)
  - program: 'weight_management'
- [x] Assessment page now passes bookingHoldId to StripePaymentForm
- [x] Women's Health StripeCheckout.tsx unchanged (different flow)

### UAT6-GAP-003: Quiz Checkout Pricing Fix (Version 617) ✅
- [x] Updated quiz checkout from $49 consultation to Core/Precision first-month payment model
- [x] Core plan: $249 due today (regularly $349, then $349/month)
- [x] Precision plan: $399 due today (regularly $499, then $499/month)
- [x] Updated booking step button: "Pay and book doctor assessment"
- [x] Updated payment step button: "Pay and book doctor assessment"
- [x] Updated StripePaymentForm button: "Pay $249 and book doctor assessment" / "Pay $399 and book doctor assessment"
- [x] Refund wording displayed: "If your Sanative doctor determines the program is not suitable, your first-month payment will be refunded"
- [x] Plan selection cards show correct pricing with $100 discount applied

### Prescription Link Fix (Version 612) ✅
- [x] Fixed link in customer profile Prescriptions tab - changed from `/admin/scripts` to `/admin/prescriptions`
- [x] Added prescriptionId query parameter handling to prescriptions page
- [x] Auto-opens prescription details dialog when navigating from customer profile

### Subscription & Billing Tabs (Version 613) ✅
- [x] Added new "Subscription" tab to customer profile showing:
  - Current plan name, amount, billing cycle, status
  - Start date and next billing date
  - Subscription management actions (Change Plan, Update Payment, Cancel)
- [x] Enhanced "Billing" tab with:
  - Detailed payment history with status icons
  - Payment method and paid date details
  - Download receipt button for paid invoices
  - Billing summary card with totals
- [x] Updated customer-assessment API to include membership subscription data
- [x] Created invoice and membership subscription for timtam test user

### Auto-Create Invoice & Subscription at Checkout (Version 614) ✅
- [x] Updated Stripe webhook to create MembershipSubscription when initial payment succeeds
- [x] Stripe webhook now sets subscriptionTier on User record
- [x] Added fallback logic to booking confirm API to create Invoice and MembershipSubscription
- [x] Fallback only creates records if they don't already exist (prevents duplicates)
- [x] Now after quiz checkout: Invoice appears in Billing tab, Plan appears in Subscription tab

### Quiz Data & Recommended Testing Display (Version 607) ✅
- [x] Added "Assessment" tab to customer profile page showing full quiz responses
- [x] Display weight/BMI summary with calculated BMI and status badge
- [x] Show medical conditions by category (metabolic, digestive, cardiovascular, mental health)
- [x] Display serious conditions/contraindications with warning styling
- [x] Show current medications
- [x] Display motivations and other health goals
- [x] Added "Recommended Testing" card in sidebar based on reported conditions
- [x] Biomarker panels recommended based on patient conditions and BMI
- [x] Care partners and doctors can now see full quiz input on customer profile

### Payment Flow Fix (Version 605) ✅
- [x] Fixed payment screen to show hold countdown warning when less than 5 minutes remaining
- [x] Added expired hold detection on payment screen
- [x] Shows friendly message when hold expires during checkout with button to select new slot
- [x] Cancelled user timtam's expired booking hold so they can restart the booking flow

### Booking Flow Infrastructure
- [x] Created booking availability API (`/api/bookings/availability`) - Returns Thu/Fri/Sat slots 9am-7pm
- [x] Created booking hold API (`/api/bookings/hold`) - 15-minute hold system
- [x] Created booking confirm API (`/api/bookings/confirm`) - Confirms booking after payment
- [x] Updated Prisma schema with new BookingStatus enum (SLOT_HELD, BOOKING_CONFIRMED, etc.)
- [x] Updated Prisma schema with expanded JourneyStatus enum (30 statuses)

### Quiz Flow Updates
- [x] Updated Step 20 (Booking) to fetch real availability from API
- [x] Implemented slot grouping by day in UI
- [x] Added slot hold creation on selection with 15-minute countdown timer
- [x] Updated `canProceed` function to require valid slot selection and active hold
- [x] Integrated payment success handler to confirm booking via API
- [x] Updated StripePaymentForm to pass paymentIntentId on success

### Schema Migration Fixes
- [x] Fixed booking confirm API - corrected notification type (INFO vs BOOKING)
- [x] Fixed booking confirm API - corrected user field access (phone vs mobile)
- [x] Updated all admin routes with new JourneyStatus values
- [x] Updated all admin routes with new BookingStatus values
- [x] Fixed intake route booking status
- [x] Fixed Stripe webhook journeyStatus

### Compliance Fixes ✅
- [x] GAP-023: Fixed biomarker/pathology overpromise in FAQSection.tsx
- [x] GAP-031: Fixed telehealth copy in FAQSection.tsx
- [x] GAP-034: Fixed private health insurance FAQ in FAQSection.tsx
- [x] Removed "free offer" language from Weight Management quiz
- [x] GAP-028: Removed biomarker upsell from pre-approval checkout flow
- [x] GAP-029: Clarified shipping details before approval
- [x] GAP-030: Removed contradictory "no commitment" copy

### Journey Status & Activation Logic Fixes ✅
- [x] GAP-007: Fixed invalid JourneyStatus values across codebase
- [x] GAP-008: Prevented premature ACTIVE membership in intake route
- [x] GAP-018: Separated payment status from program status in Stripe webhook

### Booking & Doctor Calendar Workflow Fixes ✅
- [x] GAP-010: Replaced hardcoded fictional doctors with database roster
- [x] GAP-011: Fixed Sydney timezone handling with dynamic AEST/AEDT
- [x] GAP-012: Fixed anonymous user FK issue in booking hold (nullable userId)
- [x] GAP-013: Create real doctor calendar event with full patient details
- [x] GAP-014: Fixed doctor brief URL and created doctor brief page/API
- [x] GAP-032: Made payment and booking confirmation atomic with fallback

### Stripe Billing Fixes ✅
- [x] GAP-015: Added ongoing subscription logic after doctor approval
- [x] GAP-016: Removed legacy Stripe/payment paths

### Email & Communications ✅
- [x] GAP-017: Friendlier post-payment email wording

### Portal & Treatment Pages ✅
- [x] GAP-021: Removed patient self-add medication
  - Removed "Add Treatment" button and form
  - Before approval: "Your treatment plan will appear here if your Sanative doctor confirms..."
  - After approval: Shows only doctor-prescribed treatment details (read-only)
- [x] GAP-027: Surface script/pharmacy/dispensing statuses
  - Added treatment timeline with statuses: APPROVED → SCRIPT_WRITTEN → PHARMACY_PENDING → SHIPPED → DELIVERED → ACTIVE
  - Patient sees treatment preparation and delivery status after approval
  - Program does not become active before script/pharmacy/onboarding readiness
- [x] GAP-022: Removed public GLP-1/medication promotional terms
  - Updated services page - removed semaglutide, tirzepatide references
  - Updated TreatmentsSection - removed GLP-1 medication names
  - Updated WeightLossSection - removed medication references
  - Safe replacement: "Treatment options are discussed privately with your Sanative doctor"
- [x] GAP-009: Added status-aware pre-start dashboard
  - Shows timeline for non-active users
  - Status examples: Payment received, Doctor assessment pending, Blood tests required, etc.
  - Active features are gated until true ACTIVE status
  - Portal clearly shows next step and owner

### Care Partner Operations ✅
- [x] GAP-026: Created durable pre-triage task queue
  - Added PreTriageTask model to Prisma schema
  - Created `/api/admin/pre-triage` API for care partners
  - Task includes: task ID, patient ID, intake ID, booking ID, assigned owner, due date, status, checklist, notes
  - Pre-triage checklist: quiz complete, phone confirmed, appointment confirmed, medications/allergies checked, risk flags checked, BMI checked, brief attached, ready for doctor
  - Task can be assigned, completed and audited
  - Pre-triage is separate from onboarding

### Database Migration
- [x] Applied database migration for booking flow infrastructure
- [x] Added new BookingStatus enum values
- [x] Added new JourneyStatus enum values
- [x] Added ConsultationBooking fields for booking hold system
- [x] Migrated existing records from old to new enum values
- [x] Created migration SQL for nullable userId (GAP-012)
- [x] Added PreTriageTask model (GAP-026)
- [x] Added PreTriageTaskStatus enum

### Doctor Dashboard & Approval Workflow ✅
- [x] Create doctor dashboard page (`/admin/doctor`)
- [x] Create API for doctor consultations
- [x] Create patient brief API
- [x] Create doctor decision API
- [x] Implement four decision options (Approved, Declined, Pending Tests, No Treatment)
- [x] Add manual medication entry

### Medication / Script Workflow ✅
- [x] Removed hardcoded medication options
- [x] Implemented manual medication entry
- [x] Added ScriptStatus enum
- [x] Created script workflow API
- [x] Updated prescriptions page to Script Management

## Pending ⏳

### Engineering QA (GAP-033)
- [ ] npm install
- [ ] npx prisma generate ✅
- [ ] npm run typecheck
- [ ] npm run build
- [ ] npm run test (add smoke tests if none exist)

### Smoke Tests to Add (GAP-033)
- [ ] Weight Management page loads
- [ ] Quiz starts
- [ ] Consent gate appears
- [ ] Pricing shows Core/Precision correctly
- [ ] Checkout line items are correct
- [ ] Payment success does not activate program
- [ ] Booking hold/confirm works
- [ ] Doctor pending-tests flow blocks activation
- [ ] Lab upload creates doctor final-review task
- [ ] Portal shows correct status timeline

## Skipped (Per User Request)
- [ ] GAP-035: Health Age / biomarker portal module (skipped)

## Current Status 🔄

All PCOS features complete. Ready for next task.

### Version 663 - PCOS & Metabolic Health Page
- [x] **Created comprehensive PCOS page at `/metabolic-care/pcos`**
  - Hero section with overview of PCOS and metabolic connection
  - Stats section with PCOS prevalence data
  - Interactive PCOS Risk Assessment Quiz (6 questions)
  - Risk factors and symptoms sections
  - "The Metabolic Connection" explainer section
  - "Our Approach to PCOS Care" process steps
  - Key biomarkers section with recommended panels
  - Nutrition tips for PCOS management
  - CTA section linking to biomarker testing
  - FAQ section with 6 comprehensive Q&As
  - Medical disclaimer
- [x] **Identified relevant biomarker panels**:
  - Metabolic Health Panel (HbA1c, Fasting Glucose, Insulin, HOMA-IR)
  - Hormone Balance Panel (Testosterone, DHEA, Estrogen, Cortisol)
- [x] **Quiz features**:
  - 6 questions about PCOS symptoms and risk factors
  - Progress indicator
  - Score-based risk assessment (Low/Moderate/High)
  - Personalized recommendations based on score
  - CTAs to biomarker testing after quiz completion
- [x] **Updated metabolic-care page**:
  - PCOS card now shows as available (was `available: false`)
  - Updated card color to rose/purple gradient
- [x] Fixed TypeScript error in staff route
- [x] Linter passing (pre-existing warnings in other files)

### Version 662 - Fixed Staff API Prisma Error
- [x] **Fixed Prisma error in Staff API**:
  - Identified missing `userId` field in `User` model
  - Added `userId` to `User` model in Prisma schema
  - Updated Staff API to use `userId` field
  - Fixed staff count query to properly handle user relationships
  - Staff page now correctly shows staff count and user info
- [x] **Updated Staff page**:
  - Fixed display of staff count and user information
  - Added proper error handling for missing user data
  - Improved console logging for debugging
- [x] Linter passing

### Version 660 - Staff Management Debug Logging
- [x] **Added session debug endpoint `/api/admin/debug-session`**
  - Returns session info and database user info for comparison
  - Helps diagnose role mismatches between session and database
- [x] **Added console logging to Staff API**
  - Logs session details on each request
  - Logs role check results
  - Logs staff count query results
  - Easy to see in server console what's happening
- [x] **Updated Staff page with debug info**
  - Shows session debug info when access is denied
  - Console logs session and API response data
  - Helpful instructions when access is denied
- [x] **Issue Investigation Notes**:
  - Database confirmed to have 7 staff users (1 admin, 5 doctors, 1 care partner)
  - Admin user exists: admin@sanative.com.au with role ADMIN
  - If user sees empty list, possible causes:
    1. Session cached from previous non-admin login
    2. Session not properly synced after login
    3. User needs to log out completely and log back in
- [x] Linter passing

### Version 659 - Doctor Profile Enhancement
- [x] Enhanced doctor dashboard with unified calendar support
  - Doctors can now see consultations assigned during triage
  - Added "My Patients" tab showing all patients assigned to doctor
  - Added "Care Comms" tab for viewing care communication tasks
  - Added patient statistics overview (5 metrics)
  - Support for unified slot system where doctor is assigned post-booking
- [x] **Created `/api/admin/doctor/my-patients` API endpoint**
  - Returns patients assigned to the logged-in doctor
  - Includes care communications for those patients
  - Returns patient stats (total, active, pending, approved, declined)
- [x] Linter passing

### Version 658 - Unified Calendar Fix (No Slot Duplication)
- [x] **Fixed calendar slot duplication during booking**
  - Slots were showing 3 times (once per doctor) - now shows ONE slot per time
  - Doctor assignment happens during triage by care partner
- [x] **Updated `/api/bookings/availability`**:
  - Changed from per-doctor slots to unified slots
  - New slot format: `slot_unified_<timestamp>` (doctor-agnostic)
  - Added `availableDoctors` count for capacity tracking
  - `availabilityStatus` now shows "AVAILABLE" or "LIMITED" based on capacity
- [x] **Updated `/api/bookings/hold`**:
  - Now creates bookings WITHOUT doctor assignment
  - Doctor field is null until assigned during triage
  - Supports both unified and legacy slot ID formats for backwards compatibility
  - Tracks available capacity across all doctors
- [x] **Updated assessment page**:
  - Removed `selectedDoctorId` and `selectedDoctorName` from form data
  - Updated slot types from `AvailableSlot` to `UnifiedSlot`
  - Booking screen now shows "Doctor assigned by care team" instead of doctor name
  - Slot selection no longer sets doctor fields
- [x] **Added `ASSIGN_DOCTOR_TO_BOOKING` action to triage API**:
  - Care partners can now assign doctors to bookings during triage
  - Validates doctor availability at the scheduled time
  - Creates internal notes and activity logs
- [x] Linter passing

## Architecture Notes

### Script Workflow States
```
SCRIPT_DRAFT → SCRIPT_WRITTEN → SCRIPT_SENT_TO_PHARMACY → PHARMACY_PENDING → DISPENSING → SHIPPED → DELIVERED
```

### Journey Status Flow
```
LEAD → CONSENTED → SURVEY_COMPLETED → CONSULTATION_BOOKING_STARTED → CONSULTATION_BOOKED → CONSULTATION_PAID
→ PRE_TRIAGE_PENDING → PRE_TRIAGE_COMPLETE → AWAITING_DOCTOR_CALL → CONSULT_COMPLETED
→ AWAITING_DOCTOR_DECISION → APPROVED → SCRIPT_WRITTEN → PHARMACY_PENDING → DISPENSING
→ SHIPPED → DELIVERED → ONBOARDING_PENDING → ONBOARDING_COMPLETE → ACTIVE
```

### Pre-Triage Task Checklist (GAP-026)
- [ ] Quiz complete
- [ ] Phone number confirmed
- [ ] Appointment time confirmed
- [ ] Medications/allergies checked
- [ ] Risk flags checked
- [ ] BMI checked
- [ ] Doctor brief attached
- [ ] Ready for doctor

### API Endpoints Reference
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/doctor/consultations` | GET, PATCH | List/update doctor consultations |
| `/api/admin/doctor/patient-brief/[id]` | GET | Get comprehensive patient brief |
| `/api/admin/doctor/decision` | GET, POST | Get options / Submit doctor decision |
| `/api/admin/scripts` | GET, PATCH, POST | Script workflow management |
| `/api/admin/pre-triage` | GET, PATCH, POST | Care partner pre-triage tasks |
| `/api/admin/wm-approvals` | GET, PATCH | Triage workflow (no prescription) |
| `/api/bookings/availability` | GET | Get available consultation slots |
| `/api/bookings/hold` | POST | Create slot hold |
| `/api/bookings/confirm` | POST | Confirm booking after payment |
| `/api/weight-management/journey-status` | GET | Get user's journey status |
| `/api/weight-management/treatment` | GET | Get doctor-prescribed treatments |
| `/api/admin/doctor-roster` | GET, POST, PATCH, DELETE | Manage doctor roster (availability & blocked dates) |
| `/api/admin/doctor-roster/seed` | GET, POST | Doctor roster seeding utilities |

### Medication Privacy Rules
- Medication names NOT exposed on public marketing pages
- Medication details stored in Prescription model only
- Clinical notes reference prescription ID, not medication names
- Activity logs do not include medication names
