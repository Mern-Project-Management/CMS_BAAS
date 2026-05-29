import type { Field, ValidationRule } from './types';

export interface ValidationError {
  field: string;
  message: string;
  type: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a single value against a field's rules
 */
export function validateFieldValue(
  value: any,
  field: Field
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required
  if (field.is_required) {
    if (value === null || value === undefined || value === '') {
      errors.push({
        field: field.name,
        message: `${field.display_name} is required`,
        type: 'required',
      });
    }
  }

  if (value === null || value === undefined) {
    return { valid: errors.length === 0, errors };
  }

  // Type-specific validation
  switch (field.field_type) {
    case 'Email':
    case 'Text':
    case 'Color':
      validateText(value, field, errors);
      if (field.field_type === 'Color' && value && typeof value === 'string') {
        const hex = value.trim();
        if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) {
          errors.push({
            field: field.name,
            message: `${field.display_name} must be a valid hex color (e.g. #1e8a8a)`,
            type: 'pattern',
          });
        }
      }
      break;
    case 'Number':
      validateNumber(value, field, errors);
      break;
    case 'Date':
      validateDate(value, field, errors);
      break;
    case 'DateTime':
      validateDateTime(value, field, errors);
      break;
    case 'JSON':
      validateJSON(value, field, errors);
      break;
    case 'Boolean':
      validateBoolean(value, field, errors);
      break;
    case 'Array':
      if (value !== undefined && value !== null && !Array.isArray(value)) {
        errors.push({
          field: field.name,
          message: `${field.display_name} must be an array`,
          type: 'type_mismatch',
        });
      }
      break;
  }

  // Custom validation rules
  if (field.validation_rules && Array.isArray(field.validation_rules)) {
    validateCustomRules(
      value,
      field.validation_rules as ValidationRule[],
      field,
      errors
    );
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates text values
 */
function validateText(value: any, field: Field, errors: ValidationError[]) {
  if (typeof value !== 'string') {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be text`,
      type: 'type_mismatch',
    });
    return;
  }

  const validationRules = (field.validation_rules || []) as ValidationRule[];
  validationRules.forEach((rule) => {
    switch (rule.type) {
      case 'length':
        if (value.length !== Number(rule.value)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be exactly ${rule.value} characters`,
            type: 'length',
          });
        }
        break;
      case 'min':
        if (value.length < Number(rule.value)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be at least ${rule.value} characters`,
            type: 'min_length',
          });
        }
        break;
      case 'max':
        if (value.length > Number(rule.value)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be at most ${rule.value} characters`,
            type: 'max_length',
          });
        }
        break;
      case 'pattern':
        const regex = new RegExp(rule.value as string);
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message:
              rule.message || `${field.display_name} has invalid format`,
            type: 'pattern',
          });
        }
        break;
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({
            field: field.name,
            message: rule.message || `${field.display_name} must be a valid email`,
            type: 'email',
          });
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          errors.push({
            field: field.name,
            message: rule.message || `${field.display_name} must be a valid URL`,
            type: 'url',
          });
        }
        break;
    }
  });
}

/**
 * Validates number values
 */
function validateNumber(value: any, field: Field, errors: ValidationError[]) {
  if (typeof value !== 'number') {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be a number`,
      type: 'type_mismatch',
    });
    return;
  }

  const validationRules = (field.validation_rules || []) as ValidationRule[];
  validationRules.forEach((rule) => {
    const numValue = Number(rule.value);
    switch (rule.type) {
      case 'min':
        if (value < numValue) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be at least ${numValue}`,
            type: 'min_value',
          });
        }
        break;
      case 'max':
        if (value > numValue) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be at most ${numValue}`,
            type: 'max_value',
          });
        }
        break;
    }
  });
}

/**
 * Validates date values
 */
function validateDate(value: any, field: Field, errors: ValidationError[]) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be a valid date`,
      type: 'invalid_date',
    });
  }
}

/**
 * Validates datetime values
 */
function validateDateTime(value: any, field: Field, errors: ValidationError[]) {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be a valid date and time`,
      type: 'invalid_datetime',
    });
  }
}

/**
 * Validates JSON values
 */
function validateJSON(value: any, field: Field, errors: ValidationError[]) {
  try {
    if (typeof value === 'string') {
      JSON.parse(value);
    }
  } catch {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be valid JSON`,
      type: 'invalid_json',
    });
  }
}

/**
 * Validates boolean values
 */
function validateBoolean(value: any, field: Field, errors: ValidationError[]) {
  if (typeof value !== 'boolean') {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be true or false`,
      type: 'type_mismatch',
    });
  }
}

/**
 * Validates custom rules
 */
function validateCustomRules(
  value: any,
  rules: ValidationRule[],
  field: Field,
  errors: ValidationError[]
) {
  rules.forEach((rule) => {
    switch (rule.type) {
      case 'custom':
        // Custom validation logic can be extended here
        // This would typically involve server-side validation
        break;
    }
  });
}

/**
 * Validates multiple fields at once
 */
export function validateRecord(
  data: Record<string, any>,
  fields: Field[]
): ValidationResult {
  const errors: ValidationError[] = [];

  fields.forEach((field) => {
    const result = validateFieldValue(data[field.name], field);
    errors.push(...result.errors);
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validates unique constraint (would require database check)
 */
export async function validateUniqueConstraint(
  field: Field,
  value: any,
  excludeId?: string
): Promise<boolean> {
  if (!field.is_unique) return true;

  try {
    // This would be implemented as a server action or API call
    // to check if the value already exists in the collection
    const response = await fetch(
      `/api/fields/${field.id}/validate-unique?value=${encodeURIComponent(value)}${
        excludeId ? `&excludeId=${excludeId}` : ''
      }`
    );

    const result = await response.json();
    return result.unique;
  } catch (error) {
    console.error('Error validating unique constraint:', error);
    return true; // Allow if check fails
  }
}
