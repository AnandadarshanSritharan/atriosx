/**
 * Form validation utilities for Atrios Entertainment
 */

export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 60 && /^[a-zA-Z\s.'’-]+$/.test(trimmed);
};

export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  const clean = phone.trim().replace(/[\s\-()]/g, '');
  const digits = clean.replace(/\D/g, '');
  return clean.length >= 9 && clean.length <= 16 && digits.length >= 9 && digits.length <= 15 && /^(\+?[0-9]{9,15})$/.test(clean);
};

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
};

export const validateName = (name: string): string | null => {
  if (!name || !name.trim()) return 'Name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (name.trim().length > 60) return 'Name cannot exceed 60 characters.';
  if (!/^[a-zA-Z\s.'’-]+$/.test(name.trim())) return 'Name can only contain letters and standard characters.';
  return null;
};

export const validatePhone = (phone: string): string | null => {
  if (!phone || !phone.trim()) return 'Phone number is required.';
  const clean = phone.trim().replace(/[\s\-()]/g, '');
  const digits = clean.replace(/\D/g, '');
  if (digits.length < 9) return 'Phone number must have at least 9 digits.';
  if (digits.length > 15) return 'Phone number is too long (max 15 digits).';
  if (!/^(\+?[0-9]{9,15})$/.test(clean)) return 'Please enter a valid phone number (e.g. 077 123 4567).';
  return null;
};

export const validateEmail = (email: string, required = false): string | null => {
  if (!email || !email.trim()) {
    return required ? 'Email address is required.' : null;
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
};

export const validateMessage = (message: string, minLength = 10, maxLength = 1000): string | null => {
  if (!message || !message.trim()) return 'Message is required.';
  if (message.trim().length < minLength) return `Message must be at least ${minLength} characters.`;
  if (message.trim().length > maxLength) return `Message cannot exceed ${maxLength} characters.`;
  return null;
};
