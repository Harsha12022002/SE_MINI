
// src/tests/eslint.config.test.js
import { describe, test, expect } from 'vitest';
import eslintConfig from '../../eslint.config.js'; // ✅ Fixed path - go up TWO levels

describe('ESLint Config', () => {
  test('should export configuration array', () => {
    expect(Array.isArray(eslintConfig)).toBe(true);
    expect(eslintConfig.length).toBeGreaterThan(0);
  });

  test('should have React configuration', () => {
    const hasReactConfig = eslintConfig.some(config => 
      config.files && config.files.includes('**/*.{js,jsx}')
    );
    expect(hasReactConfig).toBe(true);
  });
});
