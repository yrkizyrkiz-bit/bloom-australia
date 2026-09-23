-- Member notification frequency, plus the daily ring / meal / weigh-in ping.
CREATE TYPE "NotificationFrequency" AS ENUM ('QUIET', 'STANDARD', 'CLOSER');

ALTER TABLE "User" ADD COLUMN "notificationFrequency" "NotificationFrequency" NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "User" ADD COLUMN "dailyTrackingPing" BOOLEAN NOT NULL DEFAULT true;

-- Keep the new switch aligned with the existing weight-program reminder preference.
UPDATE "User" AS u
SET "dailyTrackingPing" = p."trackingReminders"
FROM "WeightManagementPreferences" AS p
WHERE p."userId" = u."id";
