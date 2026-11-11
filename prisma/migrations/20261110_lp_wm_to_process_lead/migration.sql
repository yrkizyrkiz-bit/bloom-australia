-- Allow unpaid LP leads to be stored before Stripe succeeds.
ALTER TABLE "to_process" ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL;
