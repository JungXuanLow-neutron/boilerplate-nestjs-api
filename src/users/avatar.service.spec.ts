import { describe, expect, it } from 'vitest';
import { detectImageType } from './avatar.service.js';
describe('avatar signatures', () => {
  it('recognizes allowed formats', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))).toBe('image/jpeg');
    expect(detectImageType(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(detectImageType(Buffer.from('RIFFxxxxWEBP'))).toBe('image/webp');
  });
  it('rejects content that merely claims to be an image', () =>
    expect(detectImageType(Buffer.from('not an image'))).toBeNull());
});
