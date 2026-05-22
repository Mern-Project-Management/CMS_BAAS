// Field Types
export type FieldType = 'Text' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 'File' | 'Image' | 'ImageArray' | 'JSON' | 'Relation' | 'Array' | 'Editor';

// Field Rules
export type FieldRule = 'Required' | 'Unique' | 'Encrypted' | 'Validation';

// Validation Rule Types
export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'length' | 'email' | 'url' | 'custom';
  value?: string | number;
  message?: string;
}

// Collection Type
export interface Collection {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  fields?: Field[];
  fieldCount?: number;
}

// Field Type
export interface Field {
  id: string;
  collection_id: string;
  name: string;
  display_name: string;
  field_type: FieldType;
  description?: string;
  is_required: boolean;
  is_unique: boolean;
  is_encrypted: boolean;
  validation_rules: ValidationRule[];
  default_value?: string;
  field_order: number;
  relation_to_collection?: string;
  created_at: string;
  updated_at: string;
}

// Field Validation Type
export interface FieldValidation {
  id: string;
  field_id: string;
  validation_type: string;
  validation_value: string;
  error_message?: string;
  created_at: string;
}

// Request/Response Types
export interface CreateCollectionRequest {
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCollectionRequest extends Partial<CreateCollectionRequest> {}

export interface CreateFieldRequest {
  collection_id: string;
  name: string;
  display_name: string;
  field_type: FieldType;
  description?: string;
  is_required?: boolean;
  is_unique?: boolean;
  is_encrypted?: boolean;
  validation_rules?: ValidationRule[];
  default_value?: string;
  field_order?: number;
  relation_to_collection?: string;
}

export interface UpdateFieldRequest extends Partial<CreateFieldRequest> {}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CollectionWithFields extends Collection {
  fields: Field[];
}

// User & Auth Types
export type UserRole = 'superadmin' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}
