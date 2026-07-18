import { describe, expect, it } from 'vitest';

import { analyzeConnections, getDefaultCategory } from './analysis';
import type { InstagramAccount, ParsedExportResult } from './types';

function account(username: string): InstagramAccount {
  return {
    username,
    normalizedUsername: username.toLowerCase(),
    profileUrl: `https://www.instagram.com/${username.toLowerCase()}/`,
  };
}

function parsedExport(followers: string[], following: string[]): ParsedExportResult {
  return {
    followers: followers.map(account),
    following: following.map(account),
    warnings: [],
    sourceSummary: {
      followerFileCount: 1,
      followingFileCount: 1,
    },
  };
}

describe('connection analysis', () => {
  it('calculates mutual and non-follower categories', () => {
    const analysis = analyzeConnections(
      parsedExport(['alpha_user', 'beta_user', 'gamma_user'], ['alpha_user', 'delta_user']),
    );

    expect(analysis.counts).toEqual({
      followers: 3,
      following: 2,
      mutual: 1,
      notFollowingBack: 1,
      notFollowedBackByUser: 2,
    });
    expect(analysis.mutual.map((item) => item.username)).toEqual(['alpha_user']);
    expect(analysis.notFollowingBack.map((item) => item.username)).toEqual(['delta_user']);
    expect(analysis.notFollowedBackByUser.map((item) => item.username)).toEqual([
      'beta_user',
      'gamma_user',
    ]);
  });

  it('represents an empty valid analysis as complete zero-value results', () => {
    const analysis = analyzeConnections(parsedExport([], []));

    expect(analysis.counts.followers).toBe(0);
    expect(analysis.counts.following).toBe(0);
    expect(getDefaultCategory(analysis)).toBe('mutual');
  });

  it('uses a sensible default result category', () => {
    const analysis = analyzeConnections(parsedExport(['alpha_user'], ['beta_user']));

    expect(getDefaultCategory(analysis)).toBe('notFollowingBack');
  });

  it('uses not-followed-back-by-user as the default when that is the only non-empty category', () => {
    const analysis = analyzeConnections(parsedExport(['alpha_user'], []));

    expect(getDefaultCategory(analysis)).toBe('notFollowedBackByUser');
  });
});
