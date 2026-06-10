// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { normalizeAttachments } from './utils';

describe('normalizeAttachments', () => {
  it('should handle strings and data URLs', () => {
    const inputs = ['data:image/png;base64,ABC', 'https://example.com/file.jpg'];
    const results = normalizeAttachments(inputs);

    expect(results.length).toBe(2);
    expect(results[0].type).toBe('image/png');
    expect(results[0].url).toBe('data:image/png;base64,ABC');

    expect(results[1].type).toBe('application/octet-stream');
    expect(results[1].url).toBe('https://example.com/file.jpg');
  });

  it('should handle objects and mixed inputs', () => {
    const inputs = [
      'https://example.com/one.png',
      { url: 'https://example.com/two.pdf', name: 'my.pdf', size: 1000 }
    ];
    const results = normalizeAttachments(inputs);

    expect(results.length).toBe(2);
    expect(results[1].name).toBe('my.pdf');
    expect(results[1].size).toBe(1000);
  });
});
