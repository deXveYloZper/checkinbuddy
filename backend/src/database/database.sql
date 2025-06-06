-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users (hosts and agents)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) CHECK (role IN ('host', 'agent')) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  location GEOGRAPHY(POINT, 4326), -- Agent location, 4326 is WGS84
  verification_status VARCHAR(20) CHECK (verification_status IN ('pending', 'verified', 'rejected')) DEFAULT 'pending',
  stripe_account_id VARCHAR(255) NULL, -- For Stripe Connect payouts
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Check-In Requests
CREATE TABLE check_in_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
  property_address TEXT NOT NULL,
  property_location GEOGRAPHY(POINT, 4326) NULL, -- Geocoded address
  guest_name VARCHAR(255) NOT NULL,
  guest_count INT DEFAULT 1,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled_host', 'cancelled_agent', 'expired')) DEFAULT 'pending',
  fee DECIMAL(10,2) DEFAULT 20.00, -- EUR
  platform_fee DECIMAL(10,2) GENERATED ALWAYS AS (fee * 0.20) STORED,
  agent_payout DECIMAL(10,2) GENERATED ALWAYS AS (fee * 0.80) STORED,
  payment_intent_id VARCHAR(255) NULL,
  cancellation_reason TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_in_request_id UUID REFERENCES check_in_requests(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES users(id) ON DELETE SET NULL,
  file_key VARCHAR(1024) NOT NULL, -- S3 object key
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- For cron job
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Geospatial indexes
CREATE INDEX users_location_idx ON users USING GIST (location);
CREATE INDEX check_in_requests_property_location_idx ON check_in_requests USING GIST (property_location);

-- Other useful indexes
CREATE INDEX users_firebase_uid_idx ON users (firebase_uid);
CREATE INDEX check_in_requests_status_idx ON check_in_requests (status);
CREATE INDEX documents_expires_at_idx ON documents (expires_at);

-- Function and Triggers for auto-updating timestamp columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_check_in_requests BEFORE UPDATE ON check_in_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp(); 