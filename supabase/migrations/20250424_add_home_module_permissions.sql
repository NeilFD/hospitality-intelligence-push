
-- First, add the 'home' module type to the available module_types enum
ALTER TYPE module_type ADD VALUE IF NOT EXISTS 'home';

-- Next, add the Home module to the permission_modules table
INSERT INTO permission_modules (module_id, module_name, module_type, display_order)
VALUES ('home', 'Home', 'home', 0)
ON CONFLICT (module_id) DO UPDATE
SET module_name = 'Home', module_type = 'home', display_order = 0;

-- Add the Home dashboard page to the permission_pages table
INSERT INTO permission_pages (page_id, module_id, page_name, page_url, display_order)
VALUES ('home-dashboard', 'home', 'Dashboard', '/home/dashboard', 1)
ON CONFLICT (page_id) DO NOTHING;

-- Give all roles access to the Home module
INSERT INTO permission_access (role_id, module_id, has_access)
VALUES 
  ('GOD', 'home', true),
  ('Super User', 'home', true),
  ('Manager', 'home', true),
  ('Team Member', 'home', true),
  ('Owner', 'home', true)
ON CONFLICT (role_id, module_id) DO UPDATE
SET has_access = true;

-- Give all roles access to the Home dashboard page
INSERT INTO permission_page_access (role_id, page_id, has_access)
VALUES 
  ('GOD', 'home-dashboard', true),
  ('Super User', 'home-dashboard', true),
  ('Manager', 'home-dashboard', true),
  ('Team Member', 'home-dashboard', true),
  ('Owner', 'home-dashboard', true)
ON CONFLICT (role_id, page_id) DO UPDATE
SET has_access = true;
