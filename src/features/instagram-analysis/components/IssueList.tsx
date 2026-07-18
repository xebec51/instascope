import type { ImportIssue } from '../types';

type IssueListProps = {
  title: string;
  issues: ImportIssue[];
  tone: 'error' | 'warning';
};

export function IssueList({ title, issues, tone }: IssueListProps) {
  if (issues.length === 0) {
    return null;
  }

  return (
    <section
      className={`issue-list issue-list--${tone}`}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      role={tone === 'error' ? 'alert' : 'status'}
      aria-labelledby={`${tone}-issues-title`}
    >
      <h2 id={`${tone}-issues-title`}>{title}</h2>
      <ul>
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${issue.fileName ?? 'general'}-${index.toString()}`}>
            <strong>{issue.message}</strong>
            {issue.fileName ? <span> File: {issue.fileName}.</span> : null}
            {issue.details ? <span> {issue.details}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
