import bcrypt from 'bcrypt';
import crypto from 'crypto';

export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + symbols;

  const passwordArray: string[] = [];
  passwordArray.push(uppercase[crypto.randomInt(0, uppercase.length)]);
  passwordArray.push(lowercase[crypto.randomInt(0, lowercase.length)]);
  passwordArray.push(numbers[crypto.randomInt(0, numbers.length)]);
  passwordArray.push(symbols[crypto.randomInt(0, symbols.length)]);

  for (let i = passwordArray.length; i < length; i++) {
    passwordArray.push(allChars[crypto.randomInt(0, allChars.length)]);
  }

  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
};

export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
