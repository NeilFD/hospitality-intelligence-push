
-- First, ensure the 'master' module type exists in the modules table
INSERT INTO permission_modules (module_id, module_name, module_type, display_order)
VALUES ('master', 'Daily Info', 'master', 1)
ON CONFLICT (module_id) DO UPDATE
SET module_name = 'Daily Info', module_type = 'master', display_order = 1;

-- Next, make sure the Home module has display_order = 2
UPDATE permission_modules
SET display_order = 2
WHERE module_id = 'home';

-- Update the remaining modules to ensure they have the correct display order
UPDATE permission_modules
SET display_order = 3
WHERE module_id = 'pl';

UPDATE permission_modules
SET display_order = 4
WHERE module_id = 'wages';

UPDATE permission_modules
SET display_order = 5
WHERE module_id = 'food';

UPDATE permission_modules
SET display_order = 6
WHERE module_id = 'beverage';

UPDATE permission_modules
SET display_order = 7
WHERE module_id = 'performance';

UPDATE permission_modules
SET display_order = 8
WHERE module_id = 'team';
