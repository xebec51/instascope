export async function copyToClipboard(text: string): Promise<void> {
  const clipboard = navigator.clipboard as Clipboard | undefined;

  if (clipboard && typeof clipboard.writeText === 'function') {
    await clipboard.writeText(text);
    return;
  }

  throw new Error('Clipboard API is unavailable in this browser.');
}

export function downloadTextFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.rel = 'noopener noreferrer';
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
