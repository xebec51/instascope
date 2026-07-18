export type RelationshipKind = 'followers' | 'following';

export type ResultCategory = 'mutual' | 'notFollowingBack' | 'notFollowedBackByUser';

export type SortMode = 'alphabetical' | 'newest' | 'oldest';

export type RawRelationshipEntry = {
  title?: unknown;
  string_list_data?: unknown;
};

export type InstagramAccount = {
  username: string;
  normalizedUsername: string;
  profileUrl: string;
  timestamp?: number;
};

export type ImportIssueSeverity = 'error' | 'warning';

export type ImportIssueCode =
  | 'unsupported-file-type'
  | 'corrupt-zip'
  | 'invalid-json'
  | 'no-followers-files'
  | 'no-following-file'
  | 'html-export'
  | 'unsupported-instagram-structure'
  | 'file-too-large'
  | 'reversed-files'
  | 'partial-valid-export'
  | 'malformed-entry'
  | 'empty-selection';

export type ImportIssue = {
  code: ImportIssueCode;
  message: string;
  severity: ImportIssueSeverity;
  fileName?: string;
  details?: string;
};

export type ParsedRelationshipFile = {
  kind: RelationshipKind;
  accounts: InstagramAccount[];
  warnings: ImportIssue[];
  fileName: string;
  sourceEntryCount: number;
};

export type ParsedExportResult = {
  followers: InstagramAccount[];
  following: InstagramAccount[];
  warnings: ImportIssue[];
  sourceSummary: {
    followerFileCount: number;
    followingFileCount: number;
  };
};

export type AnalysisCounts = {
  followers: number;
  following: number;
  mutual: number;
  notFollowingBack: number;
  notFollowedBackByUser: number;
};

export type AnalysisResults = {
  followers: InstagramAccount[];
  following: InstagramAccount[];
  mutual: InstagramAccount[];
  notFollowingBack: InstagramAccount[];
  notFollowedBackByUser: InstagramAccount[];
  counts: AnalysisCounts;
  hasTimestampData: boolean;
};

export type ImportStage = 'idle' | 'selected' | 'importing' | 'parsing' | 'complete' | 'error';

export type ImportProgress = {
  stage: ImportStage;
  message: string;
};

export type ImportSuccess = {
  ok: true;
  parsed: ParsedExportResult;
  analysis: AnalysisResults;
  warnings: ImportIssue[];
};

export type ImportFailure = {
  ok: false;
  errors: ImportIssue[];
  warnings: ImportIssue[];
};

export type ImportOutcome = ImportSuccess | ImportFailure;

export type ImportProgressCallback = (progress: ImportProgress) => void;

export type CategoryConfig = {
  id: ResultCategory;
  label: string;
  countLabel: string;
};
