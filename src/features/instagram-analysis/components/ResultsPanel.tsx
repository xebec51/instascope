import { useId, useMemo, useState } from 'react';

import { copyToClipboard, downloadTextFile } from '../../../shared/browser-actions';
import { getCategoryAccounts } from '../analysis';
import { CATEGORY_LABELS, generateAccountsCsv } from '../csv';
import type { AnalysisResults, InstagramAccount, ResultCategory, SortMode } from '../types';
import { ResultTabs } from './ResultTabs';

type ResultsPanelProps = {
  analysis: AnalysisResults;
  activeCategory: ResultCategory;
  onCategoryChange: (category: ResultCategory) => void;
};

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

function formatTimestamp(timestamp: number | undefined): string {
  if (timestamp === undefined) {
    return 'Not provided';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp * 1000));
}

function sortAccounts(accounts: InstagramAccount[], sortMode: SortMode): InstagramAccount[] {
  const sorted = [...accounts];

  if (sortMode === 'newest') {
    return sorted.sort((a, b) => (b.timestamp ?? -1) - (a.timestamp ?? -1));
  }

  if (sortMode === 'oldest') {
    return sorted.sort(
      (a, b) =>
        (a.timestamp ?? Number.POSITIVE_INFINITY) - (b.timestamp ?? Number.POSITIVE_INFINITY) ||
        a.normalizedUsername.localeCompare(b.normalizedUsername, 'en'),
    );
  }

  return sorted.sort(
    (a, b) =>
      a.normalizedUsername.localeCompare(b.normalizedUsername, 'en') ||
      a.username.localeCompare(b.username, 'en'),
  );
}

export function ResultsPanel({ analysis, activeCategory, onCategoryChange }: ResultsPanelProps) {
  const searchId = useId();
  const sortId = useId();
  const pageSizeId = useId();
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('alphabetical');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(25);
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState('');
  const accounts = getCategoryAccounts(analysis, activeCategory);
  const hasTimestampData = accounts.some((account) => account.timestamp !== undefined);

  const filteredAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searched =
      normalizedQuery.length === 0
        ? accounts
        : accounts.filter((account) => account.normalizedUsername.includes(normalizedQuery));

    return sortAccounts(searched, hasTimestampData ? sortMode : 'alphabetical');
  }, [accounts, hasTimestampData, query, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filteredAccounts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleAccounts = filteredAccounts.slice(pageStart, pageStart + pageSize);

  async function handleCopyUsername(username: string): Promise<void> {
    await copyToClipboard(username);
    setFeedback(`Copied ${username}.`);
  }

  async function handleCopyFiltered(): Promise<void> {
    await copyToClipboard(filteredAccounts.map((account) => account.username).join('\n'));
    setFeedback(`Copied ${filteredAccounts.length.toLocaleString('en-US')} usernames.`);
  }

  function handleCsvExport(): void {
    const csv = generateAccountsCsv(filteredAccounts, activeCategory);
    downloadTextFile(`instascope-${activeCategory}.csv`, csv, 'text/csv;charset=utf-8');
    setFeedback(`Exported ${CATEGORY_LABELS[activeCategory]} as CSV.`);
  }

  return (
    <section
      id={`${activeCategory}-panel`}
      className="results-section"
      role="tabpanel"
      aria-labelledby={`${activeCategory}-tab`}
    >
      <div className="section-heading">
        <p className="eyebrow">Results</p>
        <h2>Relationship categories</h2>
      </div>

      <ResultTabs
        activeCategory={activeCategory}
        counts={analysis.counts}
        onChange={onCategoryChange}
      />

      <div className="results-toolbar" aria-label="Result controls">
        <div className="field field--compact">
          <label htmlFor={searchId}>Search usernames</label>
          <input
            id={searchId}
            type="search"
            value={query}
            placeholder="Search by username"
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setPage(1);
            }}
          />
        </div>

        <div className="field field--compact">
          <label htmlFor={sortId}>Sort</label>
          <select
            id={sortId}
            value={hasTimestampData ? sortMode : 'alphabetical'}
            disabled={!hasTimestampData}
            onChange={(event) => {
              setSortMode(event.currentTarget.value as SortMode);
              setPage(1);
            }}
          >
            <option value="alphabetical">Alphabetical</option>
            <option value="newest">Newest timestamp</option>
            <option value="oldest">Oldest timestamp</option>
          </select>
        </div>

        <div className="field field--compact">
          <label htmlFor={pageSizeId}>Page size</label>
          <select
            id={pageSizeId}
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.currentTarget.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
              setPage(1);
            }}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="results-actions">
        <button
          type="button"
          className="button button--secondary"
          disabled={filteredAccounts.length === 0}
          onClick={() => {
            void handleCopyFiltered();
          }}
        >
          Copy filtered usernames
        </button>
        <button
          type="button"
          className="button button--secondary"
          disabled={filteredAccounts.length === 0}
          onClick={handleCsvExport}
        >
          Export CSV
        </button>
      </div>

      <p className="results-count" aria-live="polite">
        Showing {visibleAccounts.length.toLocaleString('en-US')} of{' '}
        {filteredAccounts.length.toLocaleString('en-US')} filtered accounts in{' '}
        {CATEGORY_LABELS[activeCategory].toLowerCase()}.
      </p>

      {filteredAccounts.length === 0 ? (
        <div className="empty-results">
          <p>No accounts match the current filter.</p>
        </div>
      ) : (
        <ol className="account-list" start={pageStart + 1}>
          {visibleAccounts.map((account) => (
            <li className="account-row" key={account.normalizedUsername}>
              <div className="account-row__main">
                <a
                  href={account.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                >
                  @{account.username}
                </a>
                <span>{formatTimestamp(account.timestamp)}</span>
              </div>
              <button
                type="button"
                className="button button--ghost"
                aria-label={`Copy ${account.username}`}
                onClick={() => {
                  void handleCopyUsername(account.username);
                }}
              >
                Copy
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="pagination" aria-label="Pagination">
        <button
          type="button"
          className="button button--secondary"
          disabled={safePage === 1}
          onClick={() => {
            setPage((currentPage) => Math.max(1, currentPage - 1));
          }}
        >
          Previous
        </button>
        <span>
          Page {safePage.toLocaleString('en-US')} of {totalPages.toLocaleString('en-US')}
        </span>
        <button
          type="button"
          className="button button--secondary"
          disabled={safePage === totalPages}
          onClick={() => {
            setPage((currentPage) => Math.min(totalPages, currentPage + 1));
          }}
        >
          Next
        </button>
      </div>

      <p className="copy-feedback" aria-live="polite">
        {feedback}
      </p>
    </section>
  );
}
