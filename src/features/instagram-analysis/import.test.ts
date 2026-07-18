import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';

import {
  detectRelationshipKindFromPath,
  importInstagramFiles,
  importManualRelationshipFiles,
} from './import';

function jsonFile(name: string, value: unknown): File {
  return new File([JSON.stringify(value)], name, { type: 'application/json' });
}

function textFile(name: string, value: string, type = 'text/plain'): File {
  return new File([value], name, { type });
}

function oversizedJsonFile(): File {
  const file = jsonFile('followers_1.json', []);
  Object.defineProperty(file, 'size', {
    configurable: true,
    value: 26 * 1024 * 1024,
  });
  return file;
}

describe('Instagram import pipeline', () => {
  it('recognizes follower pages and following filenames', () => {
    expect(
      detectRelationshipKindFromPath('connections/followers_and_following/followers_2.json'),
    ).toBe('followers');
    expect(detectRelationshipKindFromPath('following_1.json')).toBe('following');
    expect(detectRelationshipKindFromPath('profile.json')).toBeUndefined();
  });

  it('merges multiple follower pages and alternate following files', async () => {
    const result = await importInstagramFiles([
      jsonFile('followers_1.json', [{ title: 'alpha_user' }]),
      jsonFile('followers_2.json', [{ title: 'beta_user' }]),
      jsonFile('following_1.json', { relationships_following: [{ title: 'alpha_user' }] }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.analysis.counts.followers : undefined).toBe(2);
    expect(result.ok ? result.analysis.counts.mutual : undefined).toBe(1);
  });

  it('imports a ZIP archive and ignores unrelated contents', async () => {
    const archive = zipSync({
      'connections/followers_and_following/followers_1.json': strToU8(
        JSON.stringify([{ title: 'alpha_user' }]),
      ),
      'connections/followers_and_following/following.json': strToU8(
        JSON.stringify({ relationships_following: [{ title: 'beta_user' }] }),
      ),
      'media/unrelated.json': strToU8(JSON.stringify({ noisy: true })),
    });

    const result = await importInstagramFiles([
      new File([archive], 'instagram-export.zip', { type: 'application/zip' }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.parsed.sourceSummary : undefined).toEqual({
      followerFileCount: 1,
      followingFileCount: 1,
    });
  });

  it('reports invalid JSON precisely', async () => {
    const result = await importInstagramFiles([
      textFile('followers_1.json', '{not json', 'application/json'),
      jsonFile('following.json', { relationships_following: [] }),
    ]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain('invalid-json');
  });

  it('reports HTML exports precisely', async () => {
    const result = await importInstagramFiles([
      textFile('followers.html', '<!doctype html><html></html>', 'text/html'),
    ]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain('html-export');
  });

  it('reports HTML content even when the file extension is JSON', async () => {
    const result = await importInstagramFiles([
      textFile('followers_1.json', '<html></html>', 'application/json'),
    ]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain('html-export');
  });

  it('reports missing follower and following files', async () => {
    const result = await importInstagramFiles([jsonFile('profile.json', { profile: true })]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining([
        'unsupported-instagram-structure',
        'no-followers-files',
        'no-following-file',
      ]),
    );
  });

  it('reports unsupported file types', async () => {
    const result = await importInstagramFiles([textFile('notes.txt', 'hello')]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain(
      'unsupported-file-type',
    );
  });

  it('reports corrupt ZIP archives', async () => {
    const result = await importInstagramFiles([
      textFile('broken.zip', 'not a zip archive', 'application/zip'),
    ]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain('corrupt-zip');
  });

  it('reports oversized JSON before parsing', async () => {
    const result = await importInstagramFiles([
      oversizedJsonFile(),
      jsonFile('following.json', { relationships_following: [] }),
    ]);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain('file-too-large');
  });

  it('returns warnings for partially valid selections that still contain enough data', async () => {
    const result = await importInstagramFiles([
      jsonFile('followers_1.json', [{ title: 'alpha_user' }, { title: 'not valid username' }]),
      jsonFile('following.json', { relationships_following: [{ title: 'alpha_user' }] }),
      jsonFile('unrelated.json', { unrelated: true }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.warnings.map((warning) => warning.code) : []).toEqual(
      expect.arrayContaining(['partial-valid-export', 'unsupported-instagram-structure']),
    );
  });

  it('reports missing manual selections', async () => {
    const result = await importManualRelationshipFiles([], undefined);

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toEqual(
      expect.arrayContaining(['no-followers-files', 'no-following-file']),
    );
  });

  it('detects reversed manual files', async () => {
    const result = await importManualRelationshipFiles(
      [jsonFile('followers_1.json', { relationships_following: [{ title: 'alpha_user' }] })],
      jsonFile('following.json', { relationships_following: [{ title: 'alpha_user' }] }),
    );

    expect(result.ok).toBe(false);
    expect(result.ok ? [] : result.errors.map((error) => error.code)).toContain('reversed-files');
  });

  it('allows a successful empty export', async () => {
    const result = await importInstagramFiles([
      jsonFile('followers_1.json', []),
      jsonFile('following.json', { relationships_following: [] }),
    ]);

    expect(result.ok).toBe(true);
    expect(result.ok ? result.analysis.counts : undefined).toMatchObject({
      followers: 0,
      following: 0,
    });
  });
});
