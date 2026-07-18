import type { CategoryConfig, ResultCategory } from './types';

export const RESULT_CATEGORIES: CategoryConfig[] = [
  { id: 'mutual', label: 'Mutual', countLabel: 'mutual accounts' },
  {
    id: 'notFollowingBack',
    label: 'Not following back',
    countLabel: 'accounts not following you back',
  },
  {
    id: 'notFollowedBackByUser',
    label: 'You do not follow back',
    countLabel: 'followers you do not follow back',
  },
];

export const DEFAULT_RESULT_CATEGORY: ResultCategory = 'notFollowingBack';
