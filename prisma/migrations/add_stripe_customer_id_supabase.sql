-- Add stripeCustomerId column to User table for Supabase
-- Run this in Supabase SQL Editor

-- Add stripeCustomerId column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND column_name = 'stripeCustomerId'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "stripeCustomerId" TEXT;
    END IF;
END $$;






