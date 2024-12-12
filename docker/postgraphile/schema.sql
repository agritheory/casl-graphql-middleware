-- docker/postgraphile/init/01_schema.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User table with roles
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example item table for testing permissions
CREATE TABLE item (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  owner_id UUID REFERENCES app_user(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert test data
INSERT INTO app_user (username, email, role) VALUES
  ('admin', 'admin@test.com', 'admin'),
  ('user1', 'user1@test.com', 'user'),
  ('user2', 'user2@test.com', 'user');

INSERT INTO item (name, description, price, owner_id) VALUES
  ('Test Item 1', 'Description 1', 10.99, (SELECT id FROM app_user WHERE username = 'user1')),
  ('Test Item 2', 'Description 2', 20.99, (SELECT id FROM app_user WHERE username = 'user1')),
  ('Test Item 3', 'Description 3', 30.99, (SELECT id FROM app_user WHERE username = 'user2'));

-- Add RLS policies for testing
ALTER TABLE item ENABLE ROW LEVEL SECURITY;

CREATE POLICY item_select ON item
  FOR SELECT
  USING (
    owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY item_insert ON item
  FOR INSERT
  WITH CHECK (
    owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY item_update ON item
  FOR UPDATE
  USING (
    owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );

CREATE POLICY item_delete ON item
  FOR DELETE
  USING (
    owner_id = NULLIF(current_setting('app.user_id', true), '')::uuid
    OR current_setting('app.user_role', true) = 'admin'
  );