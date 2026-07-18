import { useEffect, useRef, useState } from 'react';

import { ThemeToggle } from '../components/ThemeToggle';
import { getDefaultCategory } from '../features/instagram-analysis/analysis';
import { ImportPanel } from '../features/instagram-analysis/components/ImportPanel';
import { IssueList } from '../features/instagram-analysis/components/IssueList';
import { ProcessingStatus } from '../features/instagram-analysis/components/ProcessingStatus';
import { ResultsPanel } from '../features/instagram-analysis/components/ResultsPanel';
import { StatsSummary } from '../features/instagram-analysis/components/StatsSummary';
import {
  importInstagramFiles,
  importManualRelationshipFiles,
} from '../features/instagram-analysis/import';
import type {
  AnalysisResults,
  ImportIssue,
  ImportProgress,
  ResultCategory,
} from '../features/instagram-analysis/types';
import { useThemePreference } from './theme';

const INITIAL_PROGRESS: ImportProgress = {
  stage: 'idle',
  message: 'Choose an Instagram export ZIP or JSON relationship files to begin.',
};

function selectedMessage(fileNames: string[]): ImportProgress {
  if (fileNames.length === 0) {
    return INITIAL_PROGRESS;
  }

  return {
    stage: 'selected',
    message:
      fileNames.length === 1
        ? 'One file selected and ready to analyze.'
        : `${fileNames.length.toLocaleString('en-US')} files selected and ready to analyze.`,
  };
}

export default function App() {
  const { preference, setPreference } = useThemePreference();
  const [analysis, setAnalysis] = useState<AnalysisResults>();
  const [activeCategory, setActiveCategory] = useState<ResultCategory>('notFollowingBack');
  const [progress, setProgress] = useState<ImportProgress>(INITIAL_PROGRESS);
  const [errors, setErrors] = useState<ImportIssue[]>([]);
  const [warnings, setWarnings] = useState<ImportIssue[]>([]);
  const [resetSignal, setResetSignal] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysis) {
      resultsRef.current?.focus();
    }
  }, [analysis]);

  async function runImport(importer: () => Promise<Awaited<ReturnType<typeof importInstagramFiles>>>): Promise<void> {
    setIsProcessing(true);
    setErrors([]);
    setWarnings([]);
    setAnalysis(undefined);

    try {
      const outcome = await importer();

      if (outcome.ok) {
        setAnalysis(outcome.analysis);
        setActiveCategory(getDefaultCategory(outcome.analysis));
        setWarnings(outcome.warnings);
        setProgress({
          stage: 'complete',
          message:
            outcome.analysis.counts.followers === 0 && outcome.analysis.counts.following === 0
              ? 'Analysis complete. The export is valid and contains zero followers and zero following.'
              : 'Analysis complete. Results are ready below.',
        });
        setResetSignal((value) => value + 1);
      } else {
        setErrors(outcome.errors);
        setWarnings(outcome.warnings);
        setProgress({
          stage: 'error',
          message: 'Import stopped. Review the error details and try again.',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }

  function handleReset(): void {
    setAnalysis(undefined);
    setActiveCategory('notFollowingBack');
    setProgress(INITIAL_PROGRESS);
    setErrors([]);
    setWarnings([]);
    setIsProcessing(false);
    setResetSignal((value) => value + 1);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <div className="app-shell">
        <header className="site-header">
          <div>
            <p className="eyebrow">Privacy-first browser utility</p>
            <h1>InstaScope</h1>
            <p className="site-header__description">
              Analyze official Instagram followers and following exports directly on your device.
            </p>
          </div>
          <ThemeToggle preference={preference} onChange={setPreference} />
        </header>

        <main id="main-content" className="main-layout">
          <section className="privacy-panel" aria-labelledby="privacy-title">
            <div>
              <p className="eyebrow">Privacy assurance</p>
              <h2 id="privacy-title">Files never leave this browser</h2>
            </div>
            <p>
              InstaScope has no backend, account login, analytics, or upload endpoint. It reads official Instagram
              export files locally, keeps relationship data in memory only, and caches only the application shell for
              offline use.
            </p>
          </section>

          <ImportPanel
            key={resetSignal}
            isProcessing={isProcessing}
            onSelectionChange={(fileNames) => {
              setProgress(selectedMessage(fileNames));
            }}
            onAutoImport={(files) => {
              void runImport(() =>
                importInstagramFiles(files, (nextProgress) => {
                  setProgress(nextProgress);
                }),
              );
            }}
            onManualImport={(followersFiles, followingFile) => {
              void runImport(() =>
                importManualRelationshipFiles(followersFiles, followingFile, (nextProgress) => {
                  setProgress(nextProgress);
                }),
              );
            }}
          />

          <ProcessingStatus progress={progress} />
          <IssueList title="Import errors" issues={errors} tone="error" />
          <IssueList title="Import warnings" issues={warnings} tone="warning" />

          {analysis ? (
            <div ref={resultsRef} tabIndex={-1} className="analysis-region">
              <StatsSummary counts={analysis.counts} />
              <ResultsPanel
                key={`${activeCategory}-${analysis.counts.followers.toLocaleString(
                  'en-US',
                )}-${analysis.counts.following.toLocaleString('en-US')}`}
                analysis={analysis}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>
          ) : (
            <section className="empty-state" aria-labelledby="empty-title">
              <h2 id="empty-title">Ready when your export is</h2>
              <p>
                Import a ZIP archive or the JSON files from
                connections/followers_and_following. A valid empty export will still show a completed zero-value
                analysis.
              </p>
            </section>
          )}

          <div className="reset-row">
            <button type="button" className="button button--secondary" onClick={handleReset}>
              Start over
            </button>
          </div>
        </main>

        <footer className="site-footer">
          <p>Privacy note: imported files, usernames, metrics, and generated CSV files stay on this device.</p>
          <p>
            Open source:{' '}
            <a href="https://github.com/xebec51/instascope" target="_blank" rel="noopener noreferrer">
              xebec51/instascope
            </a>
            . InstaScope is not affiliated with, endorsed by, or sponsored by Meta or Instagram.
          </p>
        </footer>
      </div>
    </>
  );
}
