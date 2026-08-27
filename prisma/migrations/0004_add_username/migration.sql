-- Add username column (unique, not null) for login by username instead of email.
-- Safe migration: add nullable first, backfill, then enforce constraints.

ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Backfill: use the local part of email as username for existing rows
UPDATE "User" SET "username" = SPLIT_PART("email", '@', 1) WHERE "username" IS NULL;

-- Enforce uniqueness and NOT NULL
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
