
-- Consolidate Berry Purple themes
WITH ranked_themes AS (
  SELECT 
    id, 
    name, 
    primary_color, 
    secondary_color,
    is_active,
    ROW_NUMBER() OVER (
      PARTITION BY name, primary_color, secondary_color 
      ORDER BY created_at
    ) as rn
  FROM themes
  WHERE name = 'Berry Purple'
)
-- Delete duplicate Berry Purple themes, keeping the first one created
DELETE FROM themes 
WHERE id IN (
  SELECT id 
  FROM ranked_themes 
  WHERE rn > 1
);

-- Ensure exactly one Berry Purple theme is active
UPDATE themes 
SET is_active = false 
WHERE name = 'Berry Purple' AND id != (
  SELECT id 
  FROM themes 
  WHERE name = 'Berry Purple' 
  ORDER BY created_at 
  LIMIT 1
);

-- Activate the first Berry Purple theme if no active theme exists
UPDATE themes 
SET is_active = true 
WHERE name = 'Berry Purple' 
AND NOT EXISTS (
  SELECT 1 
  FROM themes 
  WHERE is_active = true
);
