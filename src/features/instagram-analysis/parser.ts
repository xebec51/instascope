import type {
  ImportIssue,
  InstagramAccount,
  ParsedRelationshipFile,
  RelationshipKind,
} from './types';

const INSTAGRAM_PROFILE_BASE_URL = 'https://www.instagram.com/';
const USERNAME_PATTERN = /^[A-Za-z0-9._]{1,30}$/u;
const MAX_ENTRY_WARNINGS = 3;

type ParseSuccess = {
  ok: true;
  file: ParsedRelationshipFile;
};

type ParseFailure = {
  ok: false;
  error: ImportIssue;
};

type RelationshipPayload = {
  kind: RelationshipKind;
  entries: unknown[];
};

type RelationshipPayloadResult =
  | {
      ok: true;
      payload: RelationshipPayload;
    }
  | {
      ok: false;
      error: ImportIssue;
    };

export function createImportIssue(
  code: ImportIssue['code'],
  message: string,
  severity: ImportIssue['severity'] = 'error',
  fileName?: string,
  details?: string,
): ImportIssue {
  return {
    code,
    message,
    severity,
    ...(fileName ? { fileName } : {}),
    ...(details ? { details } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeTimestamp(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function isReasonableInstagramUsername(value: string): boolean {
  if (!USERNAME_PATTERN.test(value)) {
    return false;
  }

  if (value.startsWith('.') || value.endsWith('.') || value.includes('..')) {
    return false;
  }

  return /[A-Za-z0-9]/u.test(value);
}

export function createSafeProfileUrl(normalizedUsername: string): string {
  return `${INSTAGRAM_PROFILE_BASE_URL}${normalizedUsername}/`;
}

export function normalizeInstagramAccount(
  usernameValue: unknown,
  timestampValue?: unknown,
): InstagramAccount | undefined {
  const rawUsername = asNonEmptyString(usernameValue);

  if (!rawUsername) {
    return undefined;
  }

  const username = rawUsername.startsWith('@') ? rawUsername.slice(1).trim() : rawUsername;

  if (!isReasonableInstagramUsername(username)) {
    return undefined;
  }

  const normalizedUsername = username.toLowerCase();
  const timestamp = normalizeTimestamp(timestampValue);

  return {
    username,
    normalizedUsername,
    profileUrl: createSafeProfileUrl(normalizedUsername),
    ...(timestamp === undefined ? {} : { timestamp }),
  };
}

function compareAccounts(a: InstagramAccount, b: InstagramAccount): number {
  return (
    a.normalizedUsername.localeCompare(b.normalizedUsername, 'en') ||
    a.username.localeCompare(b.username, 'en') ||
    (a.timestamp ?? Number.POSITIVE_INFINITY) - (b.timestamp ?? Number.POSITIVE_INFINITY)
  );
}

function pickCanonicalAccount(accounts: InstagramAccount[]): InstagramAccount {
  const sorted = [...accounts].sort(compareAccounts);
  const first = sorted[0];

  if (!first) {
    throw new Error('Cannot pick a canonical account from an empty list.');
  }

  const timestamp = sorted
    .map((account) => account.timestamp)
    .filter((value): value is number => value !== undefined)
    .sort((a, b) => a - b)[0];

  return {
    username: first.username,
    normalizedUsername: first.normalizedUsername,
    profileUrl: first.profileUrl,
    ...(timestamp === undefined ? {} : { timestamp }),
  };
}

export function dedupeAndSortAccounts(accounts: InstagramAccount[]): InstagramAccount[] {
  const grouped = new Map<string, InstagramAccount[]>();

  for (const account of accounts) {
    const existing = grouped.get(account.normalizedUsername) ?? [];
    existing.push(account);
    grouped.set(account.normalizedUsername, existing);
  }

  return [...grouped.values()].map(pickCanonicalAccount).sort(compareAccounts);
}

function getStringListDataRecord(
  entry: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const listData = entry.string_list_data;

  if (!Array.isArray(listData)) {
    return undefined;
  }

  return listData.find(isRecord);
}

function extractAccountFromEntry(entry: unknown): InstagramAccount | undefined {
  if (!isRecord(entry)) {
    return undefined;
  }

  const stringData = getStringListDataRecord(entry);
  const usernameValue = asNonEmptyString(entry.title) ?? asNonEmptyString(stringData?.value);
  const timestampValue = stringData?.timestamp;

  return normalizeInstagramAccount(usernameValue, timestampValue);
}

function detectRelationshipPayload(
  json: unknown,
  fileName: string,
  expectedKind?: RelationshipKind,
): RelationshipPayloadResult {
  if (Array.isArray(json)) {
    if (expectedKind === 'following') {
      return {
        ok: false,
        error: createImportIssue(
          'reversed-files',
          'The selected following file looks like a followers export. Choose a following JSON file for this field.',
          'error',
          fileName,
        ),
      };
    }

    return {
      ok: true,
      payload: {
        kind: 'followers',
        entries: json,
      },
    };
  }

  if (!isRecord(json)) {
    return {
      ok: false,
      error: createImportIssue(
        'unsupported-instagram-structure',
        'This JSON does not match a supported Instagram followers or following export structure.',
        'error',
        fileName,
      ),
    };
  }

  const followersValue = json.relationships_followers;
  const followingValue = json.relationships_following;
  const hasFollowersKey = Object.hasOwn(json, 'relationships_followers');
  const hasFollowingKey = Object.hasOwn(json, 'relationships_following');

  if (hasFollowersKey && Array.isArray(followersValue)) {
    if (expectedKind === 'following') {
      return {
        ok: false,
        error: createImportIssue(
          'reversed-files',
          'The selected following file contains followers data. Swap the files and try again.',
          'error',
          fileName,
        ),
      };
    }

    return {
      ok: true,
      payload: {
        kind: 'followers',
        entries: followersValue,
      },
    };
  }

  if (hasFollowingKey && Array.isArray(followingValue)) {
    if (expectedKind === 'followers') {
      return {
        ok: false,
        error: createImportIssue(
          'reversed-files',
          'The selected followers file contains following data. Swap the files and try again.',
          'error',
          fileName,
        ),
      };
    }

    return {
      ok: true,
      payload: {
        kind: 'following',
        entries: followingValue,
      },
    };
  }

  return {
    ok: false,
    error: createImportIssue(
      'unsupported-instagram-structure',
      'This JSON is missing the expected Instagram relationship keys.',
      'error',
      fileName,
      hasFollowersKey || hasFollowingKey
        ? 'A relationship key was present, but its value was not an array.'
        : undefined,
    ),
  };
}

export function parseRelationshipJson(
  json: unknown,
  fileName: string,
  expectedKind?: RelationshipKind,
): ParseSuccess | ParseFailure {
  const payloadResult = detectRelationshipPayload(json, fileName, expectedKind);

  if (!payloadResult.ok) {
    return payloadResult;
  }

  const accounts: InstagramAccount[] = [];
  const entryWarnings: ImportIssue[] = [];
  let rejectedEntries = 0;

  payloadResult.payload.entries.forEach((entry, index) => {
    const account = extractAccountFromEntry(entry);

    if (account) {
      accounts.push(account);
      return;
    }

    rejectedEntries += 1;

    if (entryWarnings.length < MAX_ENTRY_WARNINGS) {
      entryWarnings.push(
        createImportIssue(
          'malformed-entry',
          'A relationship entry could not be converted into a valid Instagram username.',
          'warning',
          fileName,
          `Entry ${(index + 1).toLocaleString('en-US')} was skipped.`,
        ),
      );
    }
  });

  if (accounts.length === 0 && payloadResult.payload.entries.length > 0) {
    return {
      ok: false,
      error: createImportIssue(
        'unsupported-instagram-structure',
        'The relationship file was found, but it did not contain any valid Instagram usernames.',
        'error',
        fileName,
      ),
    };
  }

  const warnings =
    rejectedEntries > 0
      ? [
          createImportIssue(
            'partial-valid-export',
            `${rejectedEntries.toLocaleString(
              'en-US',
            )} relationship entries were skipped because they were incomplete or invalid.`,
            'warning',
            fileName,
          ),
          ...entryWarnings,
        ]
      : [];

  return {
    ok: true,
    file: {
      kind: payloadResult.payload.kind,
      accounts: dedupeAndSortAccounts(accounts),
      warnings,
      fileName,
      sourceEntryCount: payloadResult.payload.entries.length,
    },
  };
}
