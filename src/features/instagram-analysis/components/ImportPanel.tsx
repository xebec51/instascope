import { useId, useMemo, useRef, useState } from 'react';

type ImportPanelProps = {
  isProcessing: boolean;
  onSelectionChange: (fileNames: string[]) => void;
  onAutoImport: (files: File[]) => void;
  onManualImport: (followersFiles: File[], followingFile: File | undefined) => void;
};

function fileNames(files: File[]): string[] {
  return files.map((file) => file.name);
}

function describeSelection(files: File[]): string {
  if (files.length === 0) {
    return 'No files selected';
  }

  if (files.length === 1) {
    return files[0]?.name ?? 'One selected file';
  }

  return `${files.length.toLocaleString('en-US')} files selected`;
}

export function ImportPanel({
  isProcessing,
  onSelectionChange,
  onAutoImport,
  onManualImport,
}: ImportPanelProps) {
  const autoInputId = useId();
  const manualFollowersId = useId();
  const manualFollowingId = useId();
  const [autoFiles, setAutoFiles] = useState<File[]>([]);
  const [manualFollowers, setManualFollowers] = useState<File[]>([]);
  const [manualFollowing, setManualFollowing] = useState<File>();
  const [isDragOver, setIsDragOver] = useState(false);
  const autoInputRef = useRef<HTMLInputElement>(null);

  const selectedDescription = useMemo(() => describeSelection(autoFiles), [autoFiles]);

  function handleAutoFiles(files: File[]): void {
    setAutoFiles(files);
    onSelectionChange(fileNames(files));
  }

  function handleManualFollowers(files: File[]): void {
    setManualFollowers(files);
    onSelectionChange([...fileNames(files), ...(manualFollowing ? [manualFollowing.name] : [])]);
  }

  function handleManualFollowing(file: File | undefined): void {
    setManualFollowing(file);
    onSelectionChange([...fileNames(manualFollowers), ...(file ? [file.name] : [])]);
  }

  return (
    <section className="import-panel" aria-labelledby="import-title">
      <div className="section-heading">
        <p className="eyebrow">Local import</p>
        <h2 id="import-title">Import your Instagram export</h2>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="Choose or drop Instagram export files"
        className={`dropzone ${isDragOver ? 'dropzone--active' : ''}`}
        onClick={() => {
          autoInputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            autoInputRef.current?.click();
          }
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragOver(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragOver(false);
          handleAutoFiles([...event.dataTransfer.files]);
        }}
      >
        <div className="dropzone__content">
          <p className="dropzone__title">Drop a ZIP archive or JSON files here</p>
          <p className="dropzone__hint">
            Best choice: the official Instagram ZIP containing Followers and Following in JSON format.
          </p>
          <span className="button button--primary">Choose files</span>
          <input
            ref={autoInputRef}
            id={autoInputId}
            className="sr-only"
            type="file"
            accept=".zip,.json,application/zip,application/json"
            multiple
            onClick={(event) => {
              event.stopPropagation();
            }}
            onChange={(event) => {
              handleAutoFiles(Array.from(event.currentTarget.files ?? []));
            }}
          />
          <p className="file-selection" aria-live="polite">
            {selectedDescription}
          </p>
        </div>
      </div>

      <div className="actions-row">
        <button
          type="button"
          className="button button--primary"
          disabled={autoFiles.length === 0 || isProcessing}
          onClick={() => {
            onAutoImport(autoFiles);
          }}
        >
          Analyze selected export
        </button>
      </div>

      <section className="instructions" aria-labelledby="instructions-title">
        <h3 id="instructions-title">Official export settings</h3>
        <ol>
          <li>Open Instagram Accounts Center and choose Download your information.</li>
          <li>Select Followers and Following only.</li>
          <li>Choose JSON format and All time when you want a complete comparison.</li>
          <li>Import the ZIP archive here, or use the manual JSON fallback below.</li>
        </ol>
      </section>

      <details className="manual-import">
        <summary>Manual JSON import fallback</summary>
        <div className="manual-import__grid">
          <div className="field">
            <label htmlFor={manualFollowersId}>Followers JSON file or pages</label>
            <input
              id={manualFollowersId}
              type="file"
              accept=".json,application/json"
              multiple
              onChange={(event) => {
                handleManualFollowers(Array.from(event.currentTarget.files ?? []));
              }}
            />
            <p className="field__hint">Examples: followers_1.json, followers_2.json.</p>
          </div>

          <div className="field">
            <label htmlFor={manualFollowingId}>Following JSON file</label>
            <input
              id={manualFollowingId}
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                handleManualFollowing(event.currentTarget.files?.[0]);
              }}
            />
            <p className="field__hint">Examples: following.json, following_1.json.</p>
          </div>
        </div>

        <button
          type="button"
          className="button button--secondary"
          disabled={manualFollowers.length === 0 || !manualFollowing || isProcessing}
          onClick={() => {
            onManualImport(manualFollowers, manualFollowing);
          }}
        >
          Analyze manual JSON files
        </button>
      </details>
    </section>
  );
}
