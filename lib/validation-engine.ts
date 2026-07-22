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

  let isEmpty = value === null || value === undefined || value === '';

  // If it's an editor field, strip HTML tags to check if it's actually empty
  if (!isEmpty && field.field_type === 'Editor' && typeof value === 'string') {
    const stripped = value.replace(/<[^>]*>/g, '').trim();
    if (stripped === '') {
      isEmpty = true;
    }
  } else if (!isEmpty && typeof value === 'string' && value.trim() === '') {
    // Treat any string that is just whitespace as empty
    isEmpty = true;
  }

  // Check required
  if (field.is_required) {
    if (isEmpty) {
      errors.push({
        field: field.name,
        message: `${field.display_name} is required`,
        type: 'required',
      });
      return { valid: false, errors };
    }
  } else if (isEmpty) {
    // If not required and empty, it's valid, skip other checks
    return { valid: true, errors: [] };
  }

  // Type-specific validation
  switch (field.field_type) {
    case 'Email':
    case 'Text':
    case 'Textarea':
    case 'Editor':
    case 'Color':
    case 'Dropdown':
    case 'PageRoute':
    case 'SocialLink':
    case 'UrlLink':
    case 'MobileNumber':
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
      if (field.field_type === 'SocialLink' && value && typeof value === 'string') {
        const socialRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
        if (!socialRegex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.display_name} must be a valid social media link (e.g. https://linkedin.com/in/username)`,
            type: 'pattern',
          });
        }
      }
      if (field.field_type === 'Email' && value && typeof value === 'string') {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.display_name} must be a valid email address`,
            type: 'pattern',
          });
        }
      }
      if (field.field_type === 'UrlLink' && value && typeof value === 'string') {
        const urlRegex = /^https?:\/\/(localhost|([a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/[^\s]*)?$/;
        const hasScript = /<script/i.test(value);
        if (!urlRegex.test(value) || hasScript) {
          errors.push({
            field: field.name,
            message: `${field.display_name} must be a valid URL starting with http:// or https://`,
            type: 'pattern',
          });
        }
      }
      if (field.field_type === 'MobileNumber' && value && (typeof value === 'string' || typeof value === 'number')) {
        const mobileRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (!mobileRegex.test(String(value))) {
          errors.push({
            field: field.name,
            message: `${field.display_name} must be a valid mobile number (e.g. +1234567890)`,
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


  // ─── Default safety rules for Text / Textarea / Editor fields ───────────────
  // These run automatically even when no validation rules are configured.
  // Admin-configured min/max/pattern/alphanumeric/no_script_tags rules always
  // take full precedence — they suppress the matching default check entirely.
  if (
    field.field_type === 'Text' ||
    field.field_type === 'Textarea' ||
    field.field_type === 'Editor'
  ) {
    const rawVal = typeof value === 'string' ? value : String(value ?? '');
    const strVal = field.field_type === 'Editor' ? rawVal.replace(/<[^>]*>/g, '') : rawVal;
    const configuredRules = (field.validation_rules || []) as ValidationRule[];
    const hasMinRule       = configuredRules.some((r) => r.type === 'min');
    const hasMaxRule       = configuredRules.some((r) => r.type === 'max');
    const isAutoSchemaField = field.name === 'schema' || field.name.endsWith('_schema');
    // json_ld fields handle their own tag + content validation — suppress all defaults
    const hasJsonLdRule    = isAutoSchemaField || configuredRules.some((r) => r.type === 'json_ld');
    const hasNoScriptRule  = hasJsonLdRule || configuredRules.some((r) => r.type === 'no_script_tags');
    const hasAlphanumRule  = hasJsonLdRule || configuredRules.some((r) => r.type === 'alphanumeric');
    const hasPatternRule   = hasJsonLdRule || configuredRules.some((r) => r.type === 'pattern');

    // ── Default min / max lengths (overridable from admin Validation panel) ──
    const DEFAULT_LIMITS: Record<string, { min: number; max: number }> = {
      Text:     { min: 3,  max: 100   },
      Textarea: { min: 10, max: 5000  },
      Editor:   { min: 20, max: 50000 },
    };
    const limits = DEFAULT_LIMITS[field.field_type];

    if (limits && strVal.trim().length > 0) {
      if (!hasMinRule && strVal.length < limits.min) {
        errors.push({
          field: field.name,
          message: `${field.display_name} must be at least ${limits.min} characters`,
          type: 'min_length',
        });
      }
      if (!hasMaxRule && strVal.length > limits.max) {
        errors.push({
          field: field.name,
          message: `${field.display_name} must not exceed ${limits.max} characters`,
          type: 'max_length',
        });
      }
    }

    // ── Block HTML / script injection (Text & Textarea only) ─────────────────
    if (
      field.field_type !== 'Editor' &&
      !hasNoScriptRule &&
      /<[a-z][\s\S]*>/i.test(strVal)
    ) {
      errors.push({
        field: field.name,
        message: `${field.display_name} must not contain HTML or script tags`,
        type: 'no_script_tags',
      });
    }

    // ── Block pure-special-character input (no letters OR digits at all) ──────
    if (
      field.field_type !== 'Editor' &&
      !hasAlphanumRule &&
      !hasPatternRule &&
      strVal.trim().length > 0 &&
      !/[a-zA-Z0-9]/.test(strVal)
    ) {
      errors.push({
        field: field.name,
        message: `${field.display_name} must not contain only special characters`,
        type: 'pattern',
      });
    }

    // ── Require at least one letter for Text & Textarea (blocks pure numbers) ─
    // e.g. "12213", "213", "9876543210" are all rejected by default.
    // Add an explicit alphanumeric or pattern rule from admin panel to override.
    // Fields whose name contains "year" are intentionally numeric (e.g. "2018", "2018-2020") — skip.
    const isYearField = /year/i.test(field.name);
    if (
      (field.field_type === 'Text' || field.field_type === 'Textarea') &&
      !hasAlphanumRule &&
      !hasPatternRule &&
      !isYearField &&
      strVal.trim().length > 0 &&
      !/[a-zA-Z]/.test(strVal)
    ) {
      errors.push({
        field: field.name,
        message: `${field.display_name} must contain at least one letter (not numbers only)`,
        type: 'pattern',
      });
    }
  }
  // ────────────────────────────────────────────────────────────────────────────


  // ─── Auto slug validation ─────────────────────────────────────────────────
  // Any Text/Textarea field named "slug" or ending with "_slug" automatically
  // enforces slug format: lowercase letters, numbers, hyphens only.
  // Suppressed if admin adds an explicit 'slug', 'pattern', or 'alphanumeric' rule.
  const isSlugField =
    (field.field_type === 'Text' || field.field_type === 'Textarea') &&
    (field.name === 'slug' || field.name.endsWith('_slug'));

  if (isSlugField && value !== undefined && value !== null && value !== '') {
    const configuredRules = (field.validation_rules || []) as ValidationRule[];
    const hasSlugOverride = configuredRules.some(
      (r) => r.type === 'slug' || r.type === 'pattern' || r.type === 'alphanumeric'
    );
    if (!hasSlugOverride) {
      const slugVal = typeof value === 'string' ? value : String(value);
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (/<[^>]+>/i.test(slugVal)) {
        errors.push({
          field: field.name,
          message: `${field.display_name} must not contain HTML or script tags`,
          type: 'slug',
        });
      } else if (!slugRegex.test(slugVal)) {
        errors.push({
          field: field.name,
          message: `${field.display_name} must be a valid slug — only lowercase letters, numbers, and hyphens allowed (e.g. our-services, service-123)`,
          type: 'slug',
        });
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // ─── Auto schema validation ─────────────────────────────────────────────────
  // Any Text/Textarea/JSON field named "schema" or ending with "_schema"
  // automatically enforces JSON-LD schema format.
  // Suppressed if admin adds an explicit 'json_ld', 'pattern', or 'custom' rule.
  const isSchemaField =
    (field.field_type === 'Text' || field.field_type === 'Textarea' || field.field_type === 'JSON') &&
    (field.name === 'schema' || field.name.endsWith('_schema'));

  if (isSchemaField && value !== undefined && value !== null && value !== '') {
    const configuredRules = (field.validation_rules || []) as ValidationRule[];
    const hasSchemaOverride = configuredRules.some(
      (r) => r.type === 'json_ld' || r.type === 'pattern' || r.type === 'custom'
    );
    if (!hasSchemaOverride) {
      let jsonLdValid = true;
      let jsonLdParsed: any = null;
      // Auto-strip <script type="application/ld+json">...</script> wrapper if present
      let jsonLdRaw = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
      const scriptWrapMatch = jsonLdRaw.match(
        /^<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>$/i
      );
      if (scriptWrapMatch) {
        jsonLdRaw = scriptWrapMatch[1].trim();
      } else if (/<[^>]+>/i.test(jsonLdRaw)) {
        jsonLdValid = false;
      }
      if (jsonLdValid) {
        try {
          jsonLdParsed = JSON.parse(jsonLdRaw);
        } catch {
          jsonLdValid = false;
        }
      }
      if (jsonLdValid && jsonLdParsed !== null) {
        const isObject = typeof jsonLdParsed === 'object' && !Array.isArray(jsonLdParsed);
        if (!isObject || !jsonLdParsed['@context'] || !jsonLdParsed['@type']) {
          jsonLdValid = false;
        } else {
          const ctx = jsonLdParsed['@context'];
          if (typeof ctx !== 'string' || !/schema\.org/i.test(ctx)) {
            jsonLdValid = false;
          }
          if (typeof jsonLdParsed['@type'] !== 'string' || jsonLdParsed['@type'].trim() === '') {
            jsonLdValid = false;
          }
        }
      }
      if (!jsonLdValid) {
        errors.push({
          field: field.name,
          message: `${field.display_name} must be valid JSON-LD format (e.g. {"@context":"https://schema.org","@type":"Thing",...})`,
          type: 'json_ld',
        });
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────────

  // Custom validation rules (configured from admin Validation panel)
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
  if (typeof value !== 'string' && typeof value !== 'number') {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be text`,
      type: 'type_mismatch',
    });
    return;
  }

  const strValue = String(value ?? '');
  // Strip HTML tags for Editor fields so we validate the visible text content
  const textToValidate = field.field_type === 'Editor' ? strValue.replace(/<[^>]*>/g, '') : strValue;

  const validationRules = (field.validation_rules || []) as ValidationRule[];
  validationRules.forEach((rule) => {
    switch (rule.type) {
      case 'length':
        if (textToValidate.length !== Number(rule.value)) {
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
        if (textToValidate.length < Number(rule.value)) {
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
        if (textToValidate.length > Number(rule.value)) {
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
        if (!regex.test(textToValidate)) {
          errors.push({
            field: field.name,
            message:
              rule.message || `${field.display_name} has invalid format`,
            type: 'pattern',
          });
        }
        break;
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(strValue)) {
          errors.push({
            field: field.name,
            message: rule.message || `${field.display_name} must be a valid email`,
            type: 'email',
          });
        }
        break;
      case 'url':
        const urlRegex = /^https?:\/\/(localhost|([a-zA-Z0-9][-a-zA-Z0-9]*\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/[^\s]*)?$/;
        const hasScript = /<script/i.test(strValue);
        if (!urlRegex.test(strValue) || hasScript) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be a valid URL starting with http:// or https://, containing a proper domain name, and no spaces or special characters`,
            type: 'url',
          });
        }
        break;
      case 'alphanumeric':
        // Allows letters, numbers, spaces, hyphens, underscores, commas, periods,
        // question marks, exclamation marks, single/double quotes, colons, semicolons, and parentheses.
        // Rejects special symbols like @, #, $, %, *, ^, <, >, etc.
        const alphaNumRegex = /^[a-zA-Z0-9 \-_,\.\?'"\(\):;]*$/;
        if (!alphaNumRegex.test(textToValidate)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must contain only letters, numbers, spaces, hyphens, and standard punctuation (no special symbols like @, #, $, % allowed)`,
            type: 'alphanumeric',
          });
        }
        break;
      case 'no_script_tags':
        const hasScriptOrHtml = /<script\b[^>]*>|[\s\S]*<\/script>|<[^>]+>/i.test(strValue);
        if (hasScriptOrHtml) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `Invalid characters (HTML or script tags) are not allowed`,
            type: 'no_script_tags',
          });
        }
        break;
      case 'social_link':
        const socialRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/i;
        if (!socialRegex.test(strValue)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be a valid social media link (e.g., https://linkedin.com/in/username)`,
            type: 'social_link',
          });
        }
        break;
      case 'mobile':
        const mobileRegex = /^\+?[0-9\s\-()]{7,20}$/;
        if (!mobileRegex.test(strValue)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be a valid mobile number (e.g., +1234567890)`,
            type: 'mobile',
          });
        }
        break;
      case 'slug':
        // Slug must be lowercase letters, numbers, and hyphens only.
        // Rejects: spaces ("our services"), uppercase ("Our-Services"),
        //          special chars ("service@123"), script tags.
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        const slugVal = typeof value === 'string' ? value : String(value ?? '');
        if (/<[^>]+>/i.test(slugVal)) {
          errors.push({
            field: field.name,
            message: rule.message || `${field.display_name} must not contain HTML or script tags`,
            type: 'slug',
          });
        } else if (!slugRegex.test(slugVal)) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be a valid slug — only lowercase letters, numbers, and hyphens allowed (e.g. our-services, service-123)`,
            type: 'slug',
          });
        }
        break;
      case 'json_ld':
        let jsonLdValid = true;
        let jsonLdParsed: any = null;
        // Auto-strip <script type="application/ld+json">...</script> wrapper if present
        // so users can paste either raw JSON or the full script block.
        let jsonLdRaw = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
        const scriptWrapMatch = jsonLdRaw.match(
          /^<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>$/i
        );
        if (scriptWrapMatch) {
          jsonLdRaw = scriptWrapMatch[1].trim();
        } else if (/<[^>]+>/i.test(jsonLdRaw)) {
          // Contains other HTML tags that are not the ld+json wrapper — reject
          jsonLdValid = false;
        }
        if (jsonLdValid) {
          try {
            jsonLdParsed = JSON.parse(jsonLdRaw);
          } catch {
            jsonLdValid = false;
          }
        }
        if (jsonLdValid && jsonLdParsed !== null) {
          // Must be an object with @context and @type
          const isObject = typeof jsonLdParsed === 'object' && !Array.isArray(jsonLdParsed);
          if (!isObject || !jsonLdParsed['@context'] || !jsonLdParsed['@type']) {
            jsonLdValid = false;
          } else {
            // @context must reference schema.org
            const ctx = jsonLdParsed['@context'];
            if (typeof ctx !== 'string' || !/schema\.org/i.test(ctx)) {
              jsonLdValid = false;
            }
            // @type must be a non-empty string
            if (typeof jsonLdParsed['@type'] !== 'string' || jsonLdParsed['@type'].trim() === '') {
              jsonLdValid = false;
            }
          }
        }
        if (!jsonLdValid) {
          errors.push({
            field: field.name,
            message:
              rule.message ||
              `${field.display_name} must be valid JSON-LD format (e.g. {"@context":"https://schema.org","@type":"Thing",...})`,
            type: 'json_ld',
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
  if (value === undefined || value === null || value === '') return;

  const numValue = Number(value);
  if (isNaN(numValue)) {
    errors.push({
      field: field.name,
      message: `${field.display_name} must be a number`,
      type: 'type_mismatch',
    });
    return;
  }

  const validationRules = (field.validation_rules || []) as ValidationRule[];
  const minRule = validationRules.find(r => r.type === 'min');
  const maxRule = validationRules.find(r => r.type === 'max');

  // Enforce no negative numbers (default minimum is 0 if no min rule is defined)
  if (!minRule) {
    if (numValue < 0) {
      errors.push({
        field: field.name,
        message: 'Negative numbers are not allowed',
        type: 'min_value',
      });
    }
  } else {
    const minVal = Number(minRule.value);
    if (numValue < minVal) {
      errors.push({
        field: field.name,
        message: minRule.message || `${field.display_name} must be at least ${minVal}`,
        type: 'min_value',
      });
    }
  }

  // Enforce maximum allowed limit (default maximum is 999999999 if no max rule is defined)
  if (!maxRule) {
    const DEFAULT_MAX = 999999999;
    if (numValue > DEFAULT_MAX) {
      errors.push({
        field: field.name,
        message: 'Value exceeds maximum allowed limit',
        type: 'max_value',
      });
    }
  } else {
    const maxVal = Number(maxRule.value);
    if (numValue > maxVal) {
      errors.push({
        field: field.name,
        message: maxRule.message || `${field.display_name} must be at most ${maxVal}`,
        type: 'max_value',
      });
    }
  }
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
