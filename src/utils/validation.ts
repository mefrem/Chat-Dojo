/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * At least 6 characters for Firebase Auth
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Validate display name
 */
export function isValidDisplayName(name: string): boolean {
  return name.trim().length >= 2;
}
