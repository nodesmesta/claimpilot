-- Migration: Remove unique constraint from assets.policy_number
-- Allows multiple users to upload the same demo assets.
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_policy_number_key;
