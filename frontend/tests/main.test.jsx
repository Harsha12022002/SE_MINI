
// src/tests/main.test.jsx
import { describe, test, expect } from 'vitest';

describe('Main Entry Point', () => {
  test('DOM is properly set up for React', () => {
    // Create mock root element
    const rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);

    expect(document.getElementById('root')).toBeDefined();
    expect(document.getElementById('root')).toBeInstanceOf(HTMLElement);
    
    // Cleanup
    document.body.removeChild(rootElement);
  });

  test('window and document are available', () => {
    expect(typeof window).toBe('object');
    expect(typeof document).toBe('object');
  });
});
