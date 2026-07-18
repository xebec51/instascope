import { axe } from 'jest-axe';
import { strToU8, zipSync } from 'fflate';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';

function jsonFile(name: string, value: unknown): File {
  return new File([JSON.stringify(value)], name, { type: 'application/json' });
}

function invalidJsonFile(name: string): File {
  return new File(['{not json'], name, { type: 'application/json' });
}

function zipFile(name: string, entries: Record<string, unknown>): File {
  const zippedEntries = Object.fromEntries(
    Object.entries(entries).map(([path, value]) => [path, strToU8(JSON.stringify(value))]),
  );

  return new File([zipSync(zippedEntries)], name, { type: 'application/zip' });
}

function installClipboardMock(writeText: (text: string) => Promise<void>): void {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText,
    },
  });
}

function followerEntry(username: string, timestamp?: number): unknown {
  return {
    title: username,
    string_list_data: [
      {
        value: username,
        timestamp,
      },
    ],
  };
}

function followingExport(usernames: string[]): unknown {
  return {
    relationships_following: usernames.map((username, index) =>
      followerEntry(username, 1700000000 + index),
    ),
  };
}

async function importAuto(files: File[]): Promise<void> {
  const user = userEvent.setup();
  await user.upload(screen.getByLabelText(/choose instagram export files/i), files);
  await user.click(screen.getByRole('button', { name: /analyze selected export/i }));
  await screen.findByText(/analysis complete/i);
}

describe('InstaScope app', () => {
  const writeText = vi.fn<(text: string) => Promise<void>>();
  const createObjectUrl = vi.fn(() => 'blob:instascope-test');
  const revokeObjectUrl = vi.fn();

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    writeText.mockResolvedValue(undefined);
    createObjectUrl.mockReturnValue('blob:instascope-test');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrl,
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('renders the initial privacy-first state accessibly', async () => {
    const { container } = render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'InstaScope' })).toBeInTheDocument();
    expect(screen.getByText(/files never leave this browser/i)).toBeInTheDocument();
    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it('imports valid manual JSON files and shows statistics', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText(/manual json import fallback/i));
    await user.upload(screen.getByLabelText(/followers json file or pages/i), [
      jsonFile('followers_1.json', [
        followerEntry('alpha_user', 1700000000),
        followerEntry('beta_user', 1700000001),
      ]),
    ]);
    await user.upload(
      screen.getByLabelText(/following json file/i),
      jsonFile('following.json', followingExport(['alpha_user', 'delta_user'])),
    );
    await user.click(screen.getByRole('button', { name: /analyze manual json files/i }));

    await screen.findByText(/analysis complete/i);
    const stats = screen.getByRole('heading', { name: /statistics summary/i }).closest('section');
    expect(stats).not.toBeNull();
    expect(within(stats as HTMLElement).getByText('Followers')).toBeInTheDocument();
    expect(within(stats as HTMLElement).getAllByText('2')).toHaveLength(2);
    expect(screen.getByRole('tab', { name: /not following back/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('imports a valid ZIP archive', async () => {
    render(<App />);

    await importAuto([
      zipFile('instagram-export.zip', {
        'connections/followers_and_following/followers_1.json': [
          followerEntry('alpha_user'),
          followerEntry('beta_user'),
        ],
        'connections/followers_and_following/following.json': followingExport([
          'alpha_user',
          'delta_user',
        ]),
      }),
    ]);

    expect(screen.getByRole('tab', { name: /not following back/i })).toHaveTextContent('1');
  });

  it('supports drag-and-drop file selection', async () => {
    render(<App />);

    const dropTarget = screen.getByRole('button', { name: /choose or drop instagram export files/i });
    const files = [
      jsonFile('followers_1.json', [followerEntry('alpha_user')]),
      jsonFile('following.json', followingExport(['alpha_user'])),
    ];

    fireEvent.dragEnter(dropTarget);
    expect(dropTarget).toHaveClass('dropzone--active');
    fireEvent.drop(dropTarget, {
      dataTransfer: {
        files,
      },
    });

    expect(screen.getAllByText(/2 files selected/i)).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /analyze selected export/i }));
    await screen.findByText(/analysis complete/i);
  });

  it('announces a precise invalid JSON error', async () => {
    render(<App />);

    const user = userEvent.setup();
    await user.upload(screen.getByLabelText(/choose instagram export files/i), [
      invalidJsonFile('followers_1.json'),
      jsonFile('following.json', followingExport([])),
    ]);
    await user.click(screen.getByRole('button', { name: /analyze selected export/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/not valid json/i);
  });

  it('handles a successful empty export as a completed analysis', async () => {
    render(<App />);

    await importAuto([
      jsonFile('followers_1.json', []),
      jsonFile('following.json', { relationships_following: [] }),
    ]);

    expect(screen.getByText(/contains zero followers and zero following/i)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /mutual/i })).toHaveTextContent('0');
  });

  it('switches categories, searches, paginates, copies, exports CSV, and resets', async () => {
    render(<App />);
    const user = userEvent.setup();
    const followerEntries = Array.from({ length: 32 }, (_, index) =>
      followerEntry(`follower_${index.toString().padStart(2, '0')}`, 1700000000 + index),
    );

    await importAuto([
      jsonFile('followers_1.json', followerEntries),
      jsonFile('following.json', followingExport(['follower_00', 'outside_user'])),
    ]);

    await user.click(screen.getByRole('tab', { name: /you do not follow back/i }));
    expect(screen.getByRole('tab', { name: /you do not follow back/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.selectOptions(screen.getByLabelText(/sort/i), 'newest');
    expect(screen.getByRole('link', { name: /@follower_31/i })).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/sort/i), 'oldest');
    expect(screen.getByRole('link', { name: /@follower_01/i })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/search usernames/i), 'follower_2');
    expect(screen.getByText(/filtered accounts/i)).toHaveTextContent('10');

    await user.clear(screen.getByLabelText(/search usernames/i));
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();

    installClipboardMock(writeText);
    await user.click(screen.getAllByRole('button', { name: /^copy follower_/i })[0] as HTMLElement);
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/^follower_/u));
    });

    await user.click(screen.getByRole('button', { name: /copy filtered usernames/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('follower_'));

    await user.click(screen.getByRole('button', { name: /export csv/i }));
    expect(createObjectUrl).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /start over/i }));
    expect(screen.getByRole('heading', { name: /ready when your export is/i })).toBeInTheDocument();
  });

  it('supports theme selection', async () => {
    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

    await waitFor(() => {
      expect(document.documentElement.dataset.theme).toBe('dark');
    });
    expect(window.localStorage.getItem('instascope-theme')).toBe('dark');
  });

  it('supports keyboard navigation for result tabs', async () => {
    render(<App />);

    await importAuto([
      jsonFile('followers_1.json', [followerEntry('alpha_user'), followerEntry('beta_user')]),
      jsonFile('following.json', followingExport(['alpha_user', 'delta_user'])),
    ]);

    const activeTab = screen.getByRole('tab', { name: /not following back/i });
    activeTab.focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: /you do not follow back/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    screen.getByRole('tab', { name: /you do not follow back/i }).focus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /mutual/i })).toHaveAttribute('aria-selected', 'true');

    screen.getByRole('tab', { name: /mutual/i }).focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: /you do not follow back/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});
