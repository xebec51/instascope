import type { AnalysisCounts } from '../types';

type StatsSummaryProps = {
  counts: AnalysisCounts;
};

const STAT_ITEMS: Array<{ key: keyof AnalysisCounts; label: string }> = [
  { key: 'followers', label: 'Followers' },
  { key: 'following', label: 'Following' },
  { key: 'mutual', label: 'Mutual' },
  { key: 'notFollowingBack', label: 'Not following back' },
  { key: 'notFollowedBackByUser', label: 'You do not follow back' },
];

export function StatsSummary({ counts }: StatsSummaryProps) {
  return (
    <section className="stats-section" aria-labelledby="stats-title">
      <div className="section-heading">
        <p className="eyebrow">Analysis</p>
        <h2 id="stats-title">Statistics summary</h2>
      </div>
      <dl className="stats-grid">
        {STAT_ITEMS.map((item) => (
          <div className="stat-tile" key={item.key}>
            <dt>{item.label}</dt>
            <dd>{counts[item.key].toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
