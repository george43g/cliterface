import { z } from 'zod';

/**
 * Validation schemas for common CLI patterns
 */

// IP address validation
export const ipAddressSchema = z.string().regex(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 'Must be a valid IPv4 address');

// Port number validation
export const portSchema = z.string().regex(/^([1-9][0-9]{0,3}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])$/, 'Must be a valid port number (1-65535)');

// File path validation (basic)
export const filePathSchema = z.string().min(1, 'Path cannot be empty');

// Domain/hostname validation
export const hostnameSchema = z.string().regex(/^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/, 'Must be a valid hostname');

// Email validation
export const emailSchema = z.string().email('Must be a valid email address');

// URL validation
export const urlSchema = z.string().url('Must be a valid URL');

// Regex pattern validation
export const regexPatternSchema = z.string().refine(val => {
  try {
    new RegExp(val);
    return true;
  } catch {
    return false;
  }
}, 'Must be a valid regular expression');

// JSON validation
export const jsonSchema = z.string().refine(val => {
  try {
    JSON.parse(val);
    return true;
  } catch {
    return false;
  }
}, 'Must be valid JSON');

// Integer validation
export const integerSchema = z.string().regex(/^-?\d+$/, 'Must be a valid integer');

// Positive integer
export const positiveIntegerSchema = z.string().regex(/^[1-9]\d*$/, 'Must be a positive integer');

// Non-empty string
export const nonEmptyStringSchema = z.string().min(1, 'Value cannot be empty');

// UUID validation
export const uuidSchema = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, 'Must be a valid UUID');

// Hex color validation
export const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #ff0000)');

// Cron expression (basic validation)
export const cronSchema = z
  .string()
  .regex(
    /^((\*|[0-5]?\d)(-\d+)?(,(\*|[0-5]?\d)(-\d+)?)*\s+){4}(\*|([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)(,([01]?\d|2[0-3])(-([01]?\d|2[0-3]))?)*$/,
    'Must be a valid cron expression',
  );

// SSH key fingerprint
export const sshFingerprintSchema = z.string().regex(/^([a-f0-9]{2}:){15}[a-f0-9]{2}$/i, 'Must be a valid SSH fingerprint (16 colon-separated hex pairs)');

/**
 * Create a custom validator function
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return (value: string): { valid: boolean; message?: string } => {
    try {
      schema.parse(value);
      return { valid: true };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, message: error.errors[0]?.message };
      }
      return { valid: false, message: 'Invalid input' };
    }
  };
}

/**
 * Common validator presets
 */
export const validators = {
  ipAddress: createValidator(ipAddressSchema),
  port: createValidator(portSchema),
  filePath: createValidator(filePathSchema),
  hostname: createValidator(hostnameSchema),
  email: createValidator(emailSchema),
  url: createValidator(urlSchema),
  regex: createValidator(regexPatternSchema),
  json: createValidator(jsonSchema),
  integer: createValidator(integerSchema),
  positiveInteger: createValidator(positiveIntegerSchema),
  nonEmpty: createValidator(nonEmptyStringSchema),
  uuid: createValidator(uuidSchema),
  hexColor: createValidator(hexColorSchema),
  cron: createValidator(cronSchema),
  sshFingerprint: createValidator(sshFingerprintSchema),
};

/**
 * Type guard for validation results
 */
export function isValid(result: { valid: boolean }): boolean {
  return result.valid;
}
