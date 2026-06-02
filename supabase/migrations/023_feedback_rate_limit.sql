-- Track when a user last submitted feedback so we can rate-limit the endpoint.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_feedback_sent_at timestamptz;
