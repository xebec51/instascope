import type {
  AnalysisResults,
  InstagramAccount,
  ParsedExportResult,
  ResultCategory,
} from './types';

function accountMap(accounts: InstagramAccount[]): Map<string, InstagramAccount> {
  return new Map(accounts.map((account) => [account.normalizedUsername, account]));
}

function sortAccounts(accounts: InstagramAccount[]): InstagramAccount[] {
  return [...accounts].sort(
    (a, b) =>
      a.normalizedUsername.localeCompare(b.normalizedUsername, 'en') ||
      a.username.localeCompare(b.username, 'en'),
  );
}

export function analyzeConnections(parsed: ParsedExportResult): AnalysisResults {
  const followersByName = accountMap(parsed.followers);
  const followingByName = accountMap(parsed.following);

  const mutual = parsed.followers.filter((account) =>
    followingByName.has(account.normalizedUsername),
  );
  const notFollowingBack = parsed.following.filter(
    (account) => !followersByName.has(account.normalizedUsername),
  );
  const notFollowedBackByUser = parsed.followers.filter(
    (account) => !followingByName.has(account.normalizedUsername),
  );

  const hasTimestampData = [...parsed.followers, ...parsed.following].some(
    (account) => account.timestamp !== undefined,
  );

  return {
    followers: parsed.followers,
    following: parsed.following,
    mutual: sortAccounts(mutual),
    notFollowingBack: sortAccounts(notFollowingBack),
    notFollowedBackByUser: sortAccounts(notFollowedBackByUser),
    counts: {
      followers: parsed.followers.length,
      following: parsed.following.length,
      mutual: mutual.length,
      notFollowingBack: notFollowingBack.length,
      notFollowedBackByUser: notFollowedBackByUser.length,
    },
    hasTimestampData,
  };
}

export function getCategoryAccounts(
  analysis: AnalysisResults,
  category: ResultCategory,
): InstagramAccount[] {
  switch (category) {
    case 'mutual':
      return analysis.mutual;
    case 'notFollowingBack':
      return analysis.notFollowingBack;
    case 'notFollowedBackByUser':
      return analysis.notFollowedBackByUser;
  }
}

export function getDefaultCategory(analysis: AnalysisResults): ResultCategory {
  if (analysis.counts.notFollowingBack > 0) {
    return 'notFollowingBack';
  }

  if (analysis.counts.notFollowedBackByUser > 0) {
    return 'notFollowedBackByUser';
  }

  return 'mutual';
}
