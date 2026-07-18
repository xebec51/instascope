import type { ImportProgress } from '../types';

type ProcessingStatusProps = {
  progress: ImportProgress;
};

export function ProcessingStatus({ progress }: ProcessingStatusProps) {
  const isBusy = progress.stage === 'importing' || progress.stage === 'parsing';

  return (
    <section className="processing-status" aria-live="polite" aria-atomic="true">
      <h2>Processing status</h2>
      <p>
        {isBusy ? <span className="spinner" aria-hidden="true" /> : null}
        <span>{progress.message}</span>
      </p>
    </section>
  );
}
