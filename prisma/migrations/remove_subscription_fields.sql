-- Remove subscription fields from User table
-- Run this migration manually to clean up the database

ALTER TABLE "User" 
DROP COLUMN IF EXISTS "hasPaid",
DROP COLUMN IF EXISTS "paidAt",
DROP COLUMN IF EXISTS "stripeCustomerId",
DROP COLUMN IF EXISTS "stripeSubscriptionId",
DROP COLUMN IF EXISTS "subscriptionStatus",
DROP COLUMN IF EXISTS "subscriptionPlan",
DROP COLUMN IF EXISTS "subscriptionEndsAt",
DROP COLUMN IF EXISTS "cancelAtPeriodEnd";

-- Drop index if it exists
DROP INDEX IF EXISTS "User_stripeSubscriptionId_idx";

