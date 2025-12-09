-- Add subscription tracking fields to User table
-- Run this migration manually if Prisma migrate doesn't work

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT,
ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP;

-- Add index on subscription ID for faster lookups
CREATE INDEX IF NOT EXISTS "User_stripeSubscriptionId_idx" ON "User"("stripeSubscriptionId");

