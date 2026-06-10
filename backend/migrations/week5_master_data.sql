-- DB4: Master data tables and seed data

CREATE TABLE IF NOT EXISTS hazard_categories (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL UNIQUE,
  icon       VARCHAR(50),
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS severity_levels (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(50) NOT NULL UNIQUE,
  color      VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active  BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS report_statuses (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(50) NOT NULL UNIQUE,
  label     VARCHAR(100),
  is_active BOOLEAN DEFAULT true
);

-- Seed hazard_categories
INSERT INTO hazard_categories (name) VALUES
  ('Pothole'),
  ('Flooding'),
  ('Street Light Out'),
  ('Fallen Tree'),
  ('Road Damage'),
  ('Debris on Road'),
  ('Traffic Signal Issue'),
  ('Unsafe Sidewalk'),
  ('Construction Hazard'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Seed severity_levels
INSERT INTO severity_levels (name, color, sort_order) VALUES
  ('Low',      '#22c55e', 1),
  ('Medium',   '#f59e0b', 2),
  ('High',     '#ef4444', 3),
  ('Critical', '#7c3aed', 4)
ON CONFLICT (name) DO NOTHING;

-- Seed report_statuses
INSERT INTO report_statuses (name, label) VALUES
  ('pending',       'Pending Review'),
  ('investigating', 'Under Investigation'),
  ('resolved',      'Resolved'),
  ('dismissed',     'Dismissed')
ON CONFLICT (name) DO NOTHING;
