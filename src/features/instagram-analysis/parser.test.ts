import { describe, expect, it } from 'vitest';

import {
  createSafeProfileUrl,
  dedupeAndSortAccounts,
  isReasonableInstagramUsername,
  normalizeInstagramAccount,
  parseRelationshipJson,
} from './parser';

describe('Instagram relationship parser', () => {
  it('parses followers from a top-level array', () => {
    const result = parseRelationshipJson(
      [
        {
          string_list_data: [{ value: 'alpha_friend', timestamp: 1700000000 }],
        },
      ],
      'followers_1.json',
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.file.kind : undefined).toBe('followers');
    expect(result.ok ? result.file.accounts : []).toEqual([
      {
        username: 'alpha_friend',
        normalizedUsername: 'alpha_friend',
        profileUrl: 'https://www.instagram.com/alpha_friend/',
        timestamp: 1700000000,
      },
    ]);
  });

  it('parses followers from relationships_followers object shape', () => {
    const result = parseRelationshipJson(
      {
        relationships_followers: [{ title: 'beta.friend' }],
      },
      'followers.json',
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.file.accounts[0]?.username : undefined).toBe('beta.friend');
  });

  it('parses following from relationships_following object shape', () => {
    const result = parseRelationshipJson(
      {
        relationships_following: [{ title: 'gamma_friend' }],
      },
      'following.json',
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.file.kind : undefined).toBe('following');
  });

  it('prefers title usernames and falls back to string_list_data value', () => {
    const result = parseRelationshipJson(
      [
        {
          title: 'title_user',
          string_list_data: [{ value: 'value_user' }],
        },
        {
          string_list_data: [{ value: 'value_only' }],
        },
      ],
      'followers_1.json',
    );

    expect(result.ok ? result.file.accounts.map((account) => account.username) : []).toEqual([
      'title_user',
      'value_only',
    ]);
  });

  it('treats empty valid arrays as successful empty files', () => {
    const result = parseRelationshipJson([], 'followers_1.json');

    expect(result.ok).toBe(true);
    expect(result.ok ? result.file.accounts : ['unexpected']).toEqual([]);
  });

  it('returns structured errors for missing keys', () => {
    const result = parseRelationshipJson({ unrelated: [] }, 'unknown.json');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('unsupported-instagram-structure');
  });

  it('returns structured errors for malformed entries with no valid accounts', () => {
    const result = parseRelationshipJson([{ title: 'not valid username' }], 'followers_1.json');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('unsupported-instagram-structure');
  });

  it('deduplicates case differences and whitespace deterministically', () => {
    const result = parseRelationshipJson(
      [
        { title: '  Mixed_User ' },
        { title: 'mixed_user', string_list_data: [{ timestamp: 1700001000 }] },
        { title: 'Another.User' },
      ],
      'followers_1.json',
    );

    expect(result.ok ? result.file.accounts.map((account) => account.normalizedUsername) : []).toEqual([
      'another.user',
      'mixed_user',
    ]);
  });

  it('rejects invalid usernames without interpolating them into URLs', () => {
    expect(isReasonableInstagramUsername('bad/name')).toBe(false);
    expect(isReasonableInstagramUsername('bad name')).toBe(false);
    expect(isReasonableInstagramUsername('.starts_with_dot')).toBe(false);
    expect(normalizeInstagramAccount('bad/name')).toBeUndefined();
  });

  it('creates profile URLs from validated normalized usernames only', () => {
    expect(createSafeProfileUrl('safe_user.1')).toBe('https://www.instagram.com/safe_user.1/');
  });

  it('preserves optional timestamps when present', () => {
    const account = normalizeInstagramAccount('time_user', 1700002222);

    expect(account?.timestamp).toBe(1700002222);
  });

  it('warns on partially valid exports', () => {
    const result = parseRelationshipJson(
      [{ title: 'valid_user' }, { title: 'not valid' }],
      'followers_1.json',
    );

    expect(result.ok).toBe(true);
    expect(result.ok ? result.file.warnings.map((warning) => warning.code) : []).toContain(
      'partial-valid-export',
    );
  });

  it('detects reversed manual files', () => {
    const result = parseRelationshipJson(
      {
        relationships_following: [{ title: 'following_user' }],
      },
      'followers_1.json',
      'followers',
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('reversed-files');
  });

  it('detects a followers array in the manual following field as reversed', () => {
    const result = parseRelationshipJson([{ title: 'alpha_user' }], 'following.json', 'following');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('reversed-files');
  });

  it('rejects relationship keys with non-array values', () => {
    const result = parseRelationshipJson({ relationships_followers: {} }, 'followers_1.json');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.details).toContain('not an array');
  });

  it('rejects non-object and non-array JSON payloads', () => {
    const result = parseRelationshipJson('not an export', 'followers_1.json');

    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe('unsupported-instagram-structure');
  });

  it('accepts handle notation by cleaning a leading at sign', () => {
    const account = normalizeInstagramAccount('@alpha_user');

    expect(account?.username).toBe('alpha_user');
  });

  it('sorts account records predictably', () => {
    const accounts = dedupeAndSortAccounts([
      {
        username: 'zeta_user',
        normalizedUsername: 'zeta_user',
        profileUrl: 'https://www.instagram.com/zeta_user/',
      },
      {
        username: 'alpha_user',
        normalizedUsername: 'alpha_user',
        profileUrl: 'https://www.instagram.com/alpha_user/',
      },
    ]);

    expect(accounts.map((account) => account.username)).toEqual(['alpha_user', 'zeta_user']);
  });
});
