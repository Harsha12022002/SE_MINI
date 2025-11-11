import { describe, test, expect } from 'vitest';
import { authAPI, contactsAPI } from '../services/api';

describe('API Services', () => {
  test('authAPI methods exist', () => {
    expect(typeof authAPI.login).toBe('function');
    expect(typeof authAPI.logout).toBe('function');
    expect(typeof authAPI.register).toBe('function');
  });

  test('contactsAPI methods exist', () => {
    expect(typeof contactsAPI.getAll).toBe('function');
    expect(typeof contactsAPI.create).toBe('function');
    expect(typeof contactsAPI.update).toBe('function');
  });
});