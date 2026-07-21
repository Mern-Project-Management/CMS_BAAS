// Field Types
export type FieldType = 'Text' | 'Textarea' | 'Number' | 'Boolean' | 'Date' | 'DateTime' | 'File' | 'Image' | 'ImageArray' | 'JSON' | 'Relation' | 'Array' | 'Editor' | 'Color' | 'Dropdown' | 'PageRoute';

// Field Rules
export type FieldRule = 'Required' | 'Unique' | 'Encrypted' | 'Validation';

// Validation Rule Types
export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'length' | 'email' | 'url' | 'custom';
  value?: string | number;
  message?: string;
}

export interface Collection {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color?: string;
  hidden_fields?: string[];
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
  dropdown_options?: string[];
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
  hidden_fields?: string[];
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
  dropdown_options?: string[];
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
export type UserRole = 'superadmin' | 'admin' | string; // Dynamic roles

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  role_id?: string; // Reference to roles collection for dynamic roles
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
  role_id?: string;
  permissions?: string[]; // Array of permission strings
}

// Role & Permission Types
export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions?: string[];
}

export interface UpdateRoleRequest extends Partial<CreateRoleRequest> {}

// Sidebar Permission Definitions
export const SIDEBAR_PERMISSIONS = [
  'dashboard',
  'collections',
  'color-manager',
  'page-manager',
  'calendar',
  'api-docs',
  'email-templates',
  'send-email',
  'settings',
  'seo-settings',
  'pages-metadata',
  'seo-audit',
  'redirects',
  'global-presence',
  'folders',
] as const;

export type SidebarPermission = typeof SIDEBAR_PERMISSIONS[number];
