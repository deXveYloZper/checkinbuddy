-- Migration to add payment_status field to check_in_requests table
-- Created: 2024-01-15
-- Purpose: Add payment status tracking to prevent issues with unpaid requests

-- Create payment status enum type
CREATE TYPE payment_status_enum AS ENUM ('pending', 'succeeded', 'failed', 'refunded');

-- Add payment_status column to check_in_requests table
ALTER TABLE check_in_requests 
ADD COLUMN payment_status payment_status_enum NOT NULL DEFAULT 'pending';

-- Add index for better query performance
CREATE INDEX idx_check_in_requests_payment_status ON check_in_requests(payment_status);

-- Add composite index for common queries (status + payment_status)
CREATE INDEX idx_check_in_requests_status_payment ON check_in_requests(status, payment_status);

-- Update existing records to have succeeded payment status if they have a payment_intent_id
-- This is for backward compatibility with existing data
UPDATE check_in_requests 
SET payment_status = 'succeeded' 
WHERE payment_intent_id IS NOT NULL 
  AND status IN ('accepted', 'in_progress', 'completed'); 