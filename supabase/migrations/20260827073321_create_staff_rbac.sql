/*
# Staff Authentication & Role-Based Access Control (RBAC)

This migration sets up real authentication and authorization for the MiniMart POS system.

## 1. New Tables

### `staff_profiles`
Links each authenticated user to a staff profile with a role assignment.
- `id` (uuid, primary key) — references `auth.users(id)`, one profile per auth user
- `email` (text, unique, not null) — mirrors the auth email for easy lookups
- `full_name` (text, not null) — display name shown in the UI
- `role` (text, not null) — one of: 'admin', 'manager', 'cashier'
- `is_active` (boolean, default true) — allows admins to deactivate staff without deleting
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### `roles` (reference/lookup table)
- `id` (text, primary key) — 'admin', 'manager', 'cashier'
- `label` (text, not null) — human-readable label
- `description` (text) — what the role can do
- `sort_order` (int, default 0) — display order

### `permissions` (reference/lookup table)
- `id` (text, primary key) — e.g. 'view_dashboard', 'manage_products', 'process_returns'
- `label` (text, not null) — human-readable label
- `description` (text) — what the permission grants
- `category` (text) — grouping for display

### `role_permissions` (join table)
- `role_id` (text, references roles(id))
- `permission_id` (text, references permissions(id))
- Primary key: (role_id, permission_id)

## 2. Security (RLS)

- `staff_profiles`: users can read their own profile; admins can read/update/delete all profiles.
  New profiles are created only via a SECURITY DEFINER function (called after signUp) so the
  insert is done with elevated privileges, not by the anon role.
- `roles`, `permissions`, `role_permissions`: public read for any authenticated user (reference data).
- A `has_permission(text)` SQL function checks if the current user's role grants a given permission.

## 3. Seed Data

- 3 roles: admin, manager, cashier
- Permissions covering all POS views and actions
- Role-permission mappings:
  - admin: all permissions (everything)
  - manager: dashboard, sales, product report, products, invoices, returns, checkout, process_returns
  - cashier: checkout, invoices (view), process_returns

## 4. Functions

### `create_staff_profile(text, text, text)`
SECURITY DEFINER function called after sign-up. Inserts a row into staff_profiles
with the new auth user's id, email, and full name. Role defaults to 'cashier' unless
the caller is an authenticated admin (then the admin can specify the role).
This bypasses RLS so the profile insert succeeds during registration.

### `has_permission(text)`
SECURITY DEFINER function that returns true if the current authenticated user's
role has the given permission. Used by the app for server-side authorization checks.

### `update_staff_role(uuid, text)`
SECURITY DEFINER function that allows an admin to update a staff member's role.
Only users whose own role is 'admin' can call this successfully.

## 5. Important Notes

1. Email confirmation stays OFF — sign-up logs in immediately.
2. The first admin account must be created by calling create_staff_profile with
   role='admin' via execute_sql (bootstrap), or by signing up and then promoting
   via SQL. We bootstrap the first admin by inserting a profile row directly.
3. All RLS policies use auth.uid() — never current_user.
*/

-- ============================================================
-- ROLES (lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0
);

INSERT INTO roles (id, label, description, sort_order) VALUES
  ('admin', 'Administrator', 'Full access to all features and user management', 1),
  ('manager', 'Manager', 'Manage products, view reports, process returns', 2),
  ('cashier', 'Cashier', 'Process sales and handle returns', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PERMISSIONS (lookup)
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
  id text PRIMARY KEY,
  label text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general'
);

INSERT INTO permissions (id, label, description, category) VALUES
  ('pos_checkout', 'Checkout', 'Process sales and accept payments', 'sales'),
  ('view_dashboard', 'Dashboard', 'View the main dashboard', 'reports'),
  ('view_sales', 'Sales Report', 'View sales reports and export data', 'reports'),
  ('view_product_report', 'Product Report', 'View product performance summary', 'reports'),
  ('manage_products', 'Manage Products', 'Add, edit, and delete products', 'inventory'),
  ('view_invoices', 'View Invoices', 'View invoices and order history', 'sales'),
  ('process_returns', 'Process Returns', 'Process sale returns and refunds', 'sales'),
  ('manage_users', 'Manage Users', 'Create staff accounts, assign roles, deactivate users', 'admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROLE_PERMISSIONS (join)
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id text NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id text NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- Admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'admin', id FROM permissions
ON CONFLICT DO NOTHING;

-- Manager: dashboard, sales, product report, products, invoices, returns, checkout
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('manager', 'pos_checkout'),
  ('manager', 'view_dashboard'),
  ('manager', 'view_sales'),
  ('manager', 'view_product_report'),
  ('manager', 'manage_products'),
  ('manager', 'view_invoices'),
  ('manager', 'process_returns')
ON CONFLICT DO NOTHING;

-- Cashier: checkout, invoices (view), process_returns
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('cashier', 'pos_checkout'),
  ('cashier', 'view_invoices'),
  ('cashier', 'process_returns')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STAFF_PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'cashier' REFERENCES roles(id),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "staff_read_own" ON staff_profiles;
CREATE POLICY "staff_read_own"
  ON staff_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all profiles
DROP POLICY IF EXISTS "staff_read_all_admin" ON staff_profiles;
CREATE POLICY "staff_read_all_admin"
  ON staff_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  );

-- Users can update their own profile (e.g. name changes)
DROP POLICY IF EXISTS "staff_update_own" ON staff_profiles;
CREATE POLICY "staff_update_own"
  ON staff_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile (e.g. role changes, deactivation)
DROP POLICY IF EXISTS "staff_update_all_admin" ON staff_profiles;
CREATE POLICY "staff_update_all_admin"
  ON staff_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  );

-- Admins can delete profiles (deactivate/remove staff)
DROP POLICY IF EXISTS "staff_delete_admin" ON staff_profiles;
CREATE POLICY "staff_delete_admin"
  ON staff_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_profiles sp
      WHERE sp.id = auth.uid() AND sp.role = 'admin'
    )
  );

-- ============================================================
-- RLS on lookup tables (read for all authenticated)
-- ============================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_read_all" ON roles;
CREATE POLICY "roles_read_all"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "permissions_read_all" ON permissions;
CREATE POLICY "permissions_read_all"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "role_perms_read_all" ON role_permissions;
CREATE POLICY "role_perms_read_all"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Check if current user has a permission
CREATE OR REPLACE FUNCTION has_permission(perm_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM staff_profiles sp
    JOIN role_permissions rp ON rp.role_id = sp.role
    WHERE sp.id = auth.uid()
      AND sp.is_active = true
      AND rp.permission_id = perm_id
  );
$$;

-- Create a staff profile after sign-up.
-- If the caller is an authenticated admin, they can specify the role.
-- Otherwise defaults to 'cashier'.
CREATE OR REPLACE FUNCTION create_staff_profile(
  p_email text,
  p_full_name text,
  p_role text DEFAULT 'cashier'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
  caller_role text;
BEGIN
  -- Get the new user's id from auth
  new_user_id := auth.uid();

  -- If no authenticated user (sign-up flow), use the email to find the user
  IF new_user_id IS NULL THEN
    SELECT au.id INTO new_user_id
    FROM auth.users au
    WHERE au.email = p_email
    LIMIT 1;
  END IF;

  IF new_user_id IS NULL THEN
    RAISE EXCEPTION 'No auth user found for email: %', p_email;
  END IF;

  -- Check if caller is an admin (for role assignment)
  SELECT sp.role INTO caller_role
  FROM staff_profiles sp
  WHERE sp.id = auth.uid();

  -- Only admins can assign non-cashier roles
  -- During self-signup (no auth session), role defaults to cashier
  IF caller_role IS NULL OR caller_role != 'admin' THEN
    p_role := 'cashier';
  END IF;

  -- Insert the profile
  INSERT INTO staff_profiles (id, email, full_name, role)
  VALUES (new_user_id, p_email, p_full_name, p_role)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = now()
  RETURNING id;

  RETURN new_user_id;
END;
$$;

-- Update a staff member's role (admin only)
CREATE OR REPLACE FUNCTION update_staff_role(target_user_id uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT sp.role INTO caller_role
  FROM staff_profiles sp
  WHERE sp.id = auth.uid();

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can change staff roles';
  END IF;

  UPDATE staff_profiles
  SET role = new_role, updated_at = now()
  WHERE id = target_user_id;
END;
$$;

-- Toggle staff active status (admin only)
CREATE OR REPLACE FUNCTION toggle_staff_active(target_user_id uuid, new_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT sp.role INTO caller_role
  FROM staff_profiles sp
  WHERE sp.id = auth.uid();

  IF caller_role IS NULL OR caller_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can activate/deactivate staff';
  END IF;

  UPDATE staff_profiles
  SET is_active = new_active, updated_at = now()
  WHERE id = target_user_id;
END;
$$;
