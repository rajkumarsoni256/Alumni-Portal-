-- Migration: 018_create_password_reset_otps.sql
-- Description: Create dedicated password_reset_otps table for secure 6-digit OTP password reset flow

CREATE TABLE IF NOT EXISTS password_reset_otps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 0,
    max_attempts SMALLINT NOT NULL DEFAULT 5,
    verified_at TIMESTAMPTZ,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_user
ON password_reset_otps(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_password_reset_otps_expiry
ON password_reset_otps(expires_at);
