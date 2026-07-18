import type { InstagramAccount, ResultCategory } from './types';

export const CATEGORY_LABELS: Record<ResultCategory, string> = {
  mutual: 'Mutual',
  notFollowingBack: 'Not following the user back',
  notFollowedBackByUser: 'The user does not follow back',
};

export function escapeCsvCell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value);

  if (/[",\r\n]/u.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function generateAccountsCsv(
  accounts: InstagramAccount[],
  category: ResultCategory,
): string {
  const rows = [
    ['Username', 'Profile URL', 'Timestamp', 'Category'],
    ...accounts.map((account) => [
      account.username,
      account.profileUrl,
      account.timestamp,
      CATEGORY_LABELS[category],
    ]),
  ];

  return `${rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\r\n')}\r\n`;
}
