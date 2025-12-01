import { describe, it, expect } from 'vitest';
import { CreateUserSchema, CheckInScanSchema } from '@/lib/validations';

describe('Validations', () => {
  describe('CreateUserSchema', () => {
    it('should validate valid user data', () => {
      const validUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'USER' as const,
      };

      const result = CreateUserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'USER' as const,
      };

      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123',
        role: 'USER' as const,
      };

      const result = CreateUserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('CheckInScanSchema', () => {
    it('should validate valid check-in data', () => {
      const validScan = {
        code: 'TKT-123456789',
        gate: 'MAIN' as const,
      };

      const result = CheckInScanSchema.safeParse(validScan);
      expect(result.success).toBe(true);
    });

    it('should reject empty code', () => {
      const invalidScan = {
        code: '',
        gate: 'MAIN' as const,
      };

      const result = CheckInScanSchema.safeParse(invalidScan);
      expect(result.success).toBe(false);
    });

    it('should use default gate when not provided', () => {
      const scanData = {
        code: 'TKT-123456789',
      };

      const result = CheckInScanSchema.safeParse(scanData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gate).toBe('MAIN');
      }
    });
  });
});