/** Form validation utilities */

/**
 * Validate an email address.
 */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate password strength.
 * Returns { valid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (password && password.length > 72) errors.push('Password must not exceed 72 characters');
  if (password && !/[A-Z]/.test(password)) errors.push('Include at least one uppercase letter');
  if (password && !/[a-z]/.test(password)) errors.push('Include at least one lowercase letter');
  if (password && !/[0-9]/.test(password)) errors.push('Include at least one number');
  return { valid: errors.length === 0, errors };
}

/**
 * Validate a name is not blank.
 */
export function isValidName(name) {
  return typeof name === 'string' && name.trim().length >= 2;
}

/**
 * Validate a URL.
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate phone number (basic).
 */
export function isValidPhone(phone) {
  if (!phone) return false;
  return /^[+]?[\d\s-]{7,15}$/.test(phone.trim());
}

/**
 * Return a generic error message for a field.
 */
export function getFieldError(field, value) {
  switch (field) {
    case 'email':
      return isValidEmail(value) ? '' : 'Please enter a valid email address';
    case 'password':
      return validatePassword(value).errors[0] || '';
    case 'name':
      return isValidName(value) ? '' : 'Name must be at least 2 characters';
    default:
      return value?.toString().trim() ? '' : `${field} is required`;
  }
}
