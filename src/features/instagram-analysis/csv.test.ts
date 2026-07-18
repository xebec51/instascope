import { describe, expect, it } from 'vitest';

import { escapeCsvCell, generateAccountsCsv } from './csv';
import type { InstagramAccount } from './types';

describe('CSV generation', () => {
  it('escapes commas, quotes, and newlines', () => {
    expect(escapeCsvCell('a,b')).toBe('"a,b"');
    expect(escapeCsvCell('a"b')).toBe('"a""b"');
    expect(escapeCsvCell('a\nb')).toBe('"a\nb"');
    expect(escapeCsvCell(undefined)).toBe('');
  });

  it('generates category CSV locally', () => {
    const account: InstagramAccount = {
      username: 'alpha_user',
      normalizedUsername: 'alpha_user',
      profileUrl: 'https://www.instagram.com/alpha_user/',
      timestamp: 1700000000,
    };

    expect(generateAccountsCsv([account], 'mutual')).toBe(
      'Username,Profile URL,Timestamp,Category\r\nalpha_user,https://www.instagram.com/alpha_user/,1700000000,Mutual\r\n',
    );
  });
});
