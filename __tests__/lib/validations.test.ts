import { describe, it, expect } from 'vitest';
import { CreateUserSchema, LoginSchema } from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('CreateUserSchema', () => {
    it('validates correct user data', () => {
      const validUser = {
        name: 'Mario Rossi',
        email: 'mario@example.com',
        password: 'password123',
        role: 'USER' as const,
        phone: '+39 320 1234567',
      };

      const result = CreateUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidUser = {
        name: 'Mario Rossi',
        email: 'invalid-email',
        password: 'password123',
        role: 'USER' as const,
      };

      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('rejects short password', () => {
      const invalidUser = {
        name: 'Mario Rossi',
        email: 'mario@example.com',
        password: '12345',
        role: 'USER' as const,
      };

      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    it('validates correct login data', () => {
      const validLogin = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = LoginSchema.safeParse(validLogin);
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const invalidLogin = {
        email: 'test@example.com',
        password: '',
      };

      const result = LoginSchema.safeParse(invalidLogin);
      expect(result.success).toBe(false);
    });
  });
});