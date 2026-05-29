-- Collections table to store schema definitions
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  display_name VARCHAR(255) NOT NULL,
  icon VARCHAR(50),
  color VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Field types enum
CREATE TYPE field_type AS ENUM (
  'Text',
  'Textarea',
  'Number',
  'Boolean',
  'Date',
  'DateTime',
  'File',
  'Image',
  'ImageArray',
  'JSON',
  'Relation',
  'Array',
  'Editor',
  'Color'
);

-- Field rules enum
CREATE TYPE field_rule AS ENUM (
  'Required',
  'Unique',
  'Encrypted',
  'Validation'
);

-- Fields table to store field definitions
CREATE TABLE IF NOT EXISTS fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  field_type field_type NOT NULL,
  description TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  is_encrypted BOOLEAN DEFAULT FALSE,
  validation_rules JSONB DEFAULT '{}'::jsonb,
  default_value TEXT,
  field_order INTEGER,
  relation_to_collection UUID REFERENCES collections(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection_id, name)
);

-- Field validation patterns table
CREATE TABLE IF NOT EXISTS field_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  validation_type VARCHAR(100) NOT NULL,
  validation_value TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fields_collection_id ON fields(collection_id);
CREATE INDEX IF NOT EXISTS idx_field_validations_field_id ON field_validations(field_id);
CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);

-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_validations ENABLE ROW LEVEL SECURITY;

-- Create policies for collections (for public access - adjust as needed for auth)
CREATE POLICY "Enable read for all users" ON collections
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON collections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON collections
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON collections
  FOR DELETE USING (true);

-- Create policies for fields
CREATE POLICY "Enable read for all users" ON fields
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON fields
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON fields
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON fields
  FOR DELETE USING (true);

-- Create policies for field_validations
CREATE POLICY "Enable read for all users" ON field_validations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON field_validations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON field_validations
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON field_validations
  FOR DELETE USING (true);
