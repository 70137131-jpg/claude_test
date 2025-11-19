/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * GitHub URL validation
 */
export const isValidGithubUrl = (url: string): boolean => {
  if (!isValidUrl(url)) return false;
  const githubRegex = /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+/;
  return githubRegex.test(url);
};

/**
 * Password strength validation
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
};

/**
 * File extension validation
 */
export const isValidFileExtension = (filename: string, allowedExtensions: string[]): boolean => {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  return allowedExtensions.includes(ext);
};
