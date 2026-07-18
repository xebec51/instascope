import { strFromU8, unzip } from 'fflate';

import { analyzeConnections } from './analysis';
import { createImportIssue, dedupeAndSortAccounts, parseRelationshipJson } from './parser';
import type {
  ImportIssue,
  ImportOutcome,
  ImportProgressCallback,
  ImportSuccess,
  ParsedExportResult,
  ParsedRelationshipFile,
  RelationshipKind,
} from './types';

export const MAX_JSON_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_ZIP_FILE_BYTES = 100 * 1024 * 1024;

type JsonSource = {
  name: string;
  text: string;
  expectedKind?: RelationshipKind;
};

const RELATIONSHIP_DIRECTORY_HINT = 'connections/followers_and_following/';

function basename(path: string): string {
  return path.replaceAll('\\', '/').split('/').at(-1)?.toLowerCase() ?? path.toLowerCase();
}

export function detectRelationshipKindFromPath(path: string): RelationshipKind | undefined {
  const fileName = basename(path);

  if (/^followers(?:_\d+)?\.json$/u.test(fileName)) {
    return 'followers';
  }

  if (/^following(?:_\d+)?\.json$/u.test(fileName)) {
    return 'following';
  }

  return undefined;
}

function isJsonFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.json');
}

function isZipFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.zip');
}

function isHtmlFileName(fileName: string): boolean {
  return /\.html?$/iu.test(fileName);
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart().slice(0, 120).toLowerCase();
  return trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.startsWith('<');
}

function downgradeToWarning(issue: ImportIssue): ImportIssue {
  return {
    ...issue,
    severity: 'warning',
  };
}

function summarizeUnsupportedFile(fileName: string): ImportIssue {
  return createImportIssue(
    'unsupported-file-type',
    'Unsupported file type. Import a ZIP archive or JSON relationship files from Instagram.',
    'error',
    fileName,
  );
}

function validateFileSize(file: File): ImportIssue | undefined {
  if (isZipFileName(file.name) && file.size > MAX_ZIP_FILE_BYTES) {
    return createImportIssue(
      'file-too-large',
      'This ZIP archive is too large to process safely in the browser. Export only "Followers and Following" in JSON format from Accounts Center, then try again.',
      'error',
      file.name,
      `Limit: ${Math.round(MAX_ZIP_FILE_BYTES / 1024 / 1024).toLocaleString('en-US')} MB.`,
    );
  }

  if (isJsonFileName(file.name) && file.size > MAX_JSON_FILE_BYTES) {
    return createImportIssue(
      'file-too-large',
      'This JSON file is too large to process safely in the browser.',
      'error',
      file.name,
      `Limit: ${Math.round(MAX_JSON_FILE_BYTES / 1024 / 1024).toLocaleString('en-US')} MB.`,
    );
  }

  return undefined;
}

async function readFileText(file: File): Promise<string> {
  return file.text();
}

async function readJsonSource(file: File, expectedKind?: RelationshipKind): Promise<JsonSource | ImportIssue> {
  if (isHtmlFileName(file.name)) {
    return createImportIssue(
      'html-export',
      'This looks like an HTML export. Request the Instagram data export in JSON format and try again.',
      'error',
      file.name,
    );
  }

  const text = await readFileText(file);

  if (looksLikeHtml(text)) {
    return createImportIssue(
      'html-export',
      'This file appears to be an HTML export. InstaScope supports Instagram JSON exports only.',
      'error',
      file.name,
    );
  }

  return {
    name: file.name,
    text,
    ...(expectedKind ? { expectedKind } : {}),
  };
}

function parseJsonSource(source: JsonSource): ParsedRelationshipFile | ImportIssue {
  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(source.text) as unknown;
  } catch {
    return createImportIssue(
      'invalid-json',
      'This file is not valid JSON. Re-export your Instagram data in JSON format and try again.',
      'error',
      source.name,
    );
  }

  const parsed = parseRelationshipJson(parsedJson, source.name, source.expectedKind);
  return parsed.ok ? parsed.file : parsed.error;
}

function unzipRelationshipSources(file: File): Promise<JsonSource[] | ImportIssue[]> {
  return new Promise((resolve) => {
    file
      .arrayBuffer()
      .then((buffer) => {
        const bytes = new Uint8Array(buffer);
        const oversizedEntries: ImportIssue[] = [];

        unzip(
          bytes,
          {
            filter(zipEntry) {
              const kind = detectRelationshipKindFromPath(zipEntry.name);

              if (!kind) {
                return false;
              }

              if (zipEntry.originalSize > MAX_JSON_FILE_BYTES) {
                oversizedEntries.push(
                  createImportIssue(
                    'file-too-large',
                    'A relationship JSON file inside the archive is too large to process safely.',
                    'error',
                    zipEntry.name,
                    `Export only ${RELATIONSHIP_DIRECTORY_HINT} in JSON format if the full archive is very large.`,
                  ),
                );
                return false;
              }

              return true;
            },
          },
          (error, unzipped) => {
            if (error) {
              resolve([
                createImportIssue(
                  'corrupt-zip',
                  'This ZIP archive could not be opened. Download a fresh Instagram export and try again.',
                  'error',
                  file.name,
                ),
              ]);
              return;
            }

            const sources: JsonSource[] = Object.entries(unzipped)
              .sort(([a], [b]) => a.localeCompare(b, 'en'))
              .flatMap(([name, data]) => {
                const expectedKind = detectRelationshipKindFromPath(name);

                if (!expectedKind) {
                  return [];
                }

                return [
                  {
                    name,
                    text: strFromU8(data),
                    expectedKind,
                  },
                ];
              });

            if (sources.length === 0 && oversizedEntries.length > 0) {
              resolve(oversizedEntries);
              return;
            }

            resolve(sources);
          },
        );
      })
      .catch(() => {
        resolve([
          createImportIssue(
            'corrupt-zip',
            'This ZIP archive could not be read by the browser.',
            'error',
            file.name,
          ),
        ]);
      });
  });
}

async function collectAutoSources(
  files: File[],
  onProgress?: ImportProgressCallback,
): Promise<{
  sources: JsonSource[];
  errors: ImportIssue[];
}> {
  const sources: JsonSource[] = [];
  const errors: ImportIssue[] = [];

  onProgress?.({
    stage: 'importing',
    message: 'Reading selected files locally in this browser.',
  });

  for (const file of files) {
    const sizeIssue = validateFileSize(file);

    if (sizeIssue) {
      errors.push(sizeIssue);
      continue;
    }

    if (isZipFileName(file.name)) {
      const archiveResult = await unzipRelationshipSources(file);

      if (archiveResult.every((item): item is ImportIssue => 'code' in item)) {
        errors.push(...archiveResult);
      } else {
        sources.push(...archiveResult);
      }

      continue;
    }

    if (isJsonFileName(file.name) || isHtmlFileName(file.name)) {
      const source = await readJsonSource(file);

      if ('code' in source) {
        errors.push(source);
      } else {
        sources.push(source);
      }

      continue;
    }

    errors.push(summarizeUnsupportedFile(file.name));
  }

  return { sources, errors };
}

function buildImportOutcome(
  parsedFiles: ParsedRelationshipFile[],
  issues: ImportIssue[],
): ImportOutcome {
  const followerFiles = parsedFiles.filter((file) => file.kind === 'followers');
  const followingFiles = parsedFiles.filter((file) => file.kind === 'following');
  const fatalErrors: ImportIssue[] = [];

  if (followerFiles.length === 0) {
    fatalErrors.push(
      createImportIssue(
        'no-followers-files',
        'No followers JSON files were found. Include followers_1.json or the official export ZIP.',
      ),
    );
  }

  if (followingFiles.length === 0) {
    fatalErrors.push(
      createImportIssue(
        'no-following-file',
        'No following JSON file was found. Include following.json, following_1.json, or the official export ZIP.',
      ),
    );
  }

  if (fatalErrors.length > 0) {
    return {
      ok: false,
      errors: [...issues, ...fatalErrors].filter((issue) => issue.severity === 'error'),
      warnings: issues.filter((issue) => issue.severity === 'warning'),
    };
  }

  const warnings = [
    ...parsedFiles.flatMap((file) => file.warnings),
    ...issues.map(downgradeToWarning),
  ];

  const parsed: ParsedExportResult = {
    followers: dedupeAndSortAccounts(followerFiles.flatMap((file) => file.accounts)),
    following: dedupeAndSortAccounts(followingFiles.flatMap((file) => file.accounts)),
    warnings,
    sourceSummary: {
      followerFileCount: followerFiles.length,
      followingFileCount: followingFiles.length,
    },
  };

  const success: ImportSuccess = {
    ok: true,
    parsed,
    analysis: analyzeConnections(parsed),
    warnings,
  };

  return success;
}

async function parseSources(
  sources: JsonSource[],
  existingIssues: ImportIssue[],
  onProgress?: ImportProgressCallback,
): Promise<ImportOutcome> {
  onProgress?.({
    stage: 'parsing',
    message: 'Parsing Instagram relationship data without uploading anything.',
  });

  await new Promise((resolve) => window.setTimeout(resolve, 0));

  const parsedFiles: ParsedRelationshipFile[] = [];
  const issues = [...existingIssues];

  for (const source of sources) {
    const parsed = parseJsonSource(source);

    if ('code' in parsed) {
      issues.push(parsed);
    } else {
      parsedFiles.push(parsed);
    }
  }

  return buildImportOutcome(parsedFiles, issues);
}

export async function importInstagramFiles(
  files: File[],
  onProgress?: ImportProgressCallback,
): Promise<ImportOutcome> {
  if (files.length === 0) {
    return {
      ok: false,
      errors: [
        createImportIssue(
          'empty-selection',
          'Choose an Instagram export ZIP or JSON relationship files first.',
        ),
      ],
      warnings: [],
    };
  }

  const { sources, errors } = await collectAutoSources(files, onProgress);
  return parseSources(sources, errors, onProgress);
}

export async function importManualRelationshipFiles(
  followersFiles: File[],
  followingFile: File | undefined,
  onProgress?: ImportProgressCallback,
): Promise<ImportOutcome> {
  const errors: ImportIssue[] = [];
  const sources: JsonSource[] = [];

  if (followersFiles.length === 0) {
    errors.push(
      createImportIssue(
        'no-followers-files',
        'Choose at least one followers JSON file for the manual import.',
      ),
    );
  }

  if (!followingFile) {
    errors.push(createImportIssue('no-following-file', 'Choose a following JSON file for the manual import.'));
  }

  onProgress?.({
    stage: 'importing',
    message: 'Reading the manually selected JSON files locally.',
  });

  for (const file of followersFiles) {
    const sizeIssue = validateFileSize(file);

    if (sizeIssue) {
      errors.push(sizeIssue);
      continue;
    }

    if (!isJsonFileName(file.name) && !isHtmlFileName(file.name)) {
      errors.push(summarizeUnsupportedFile(file.name));
      continue;
    }

    const source = await readJsonSource(file, 'followers');
    if ('code' in source) {
      errors.push(source);
    } else {
      sources.push(source);
    }
  }

  if (followingFile) {
    const sizeIssue = validateFileSize(followingFile);

    if (sizeIssue) {
      errors.push(sizeIssue);
    } else if (!isJsonFileName(followingFile.name) && !isHtmlFileName(followingFile.name)) {
      errors.push(summarizeUnsupportedFile(followingFile.name));
    } else {
      const source = await readJsonSource(followingFile, 'following');
      if ('code' in source) {
        errors.push(source);
      } else {
        sources.push(source);
      }
    }
  }

  return parseSources(sources, errors, onProgress);
}
