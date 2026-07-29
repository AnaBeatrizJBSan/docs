/**
 * Formatter for PseudoWired code syntax.
 * Normalizes block headers (QUANDO, SE, ENTÃO, etc.), line indentations, and spacing.
 */
export function formatPseudoWired(rawCode: string): string {
  if (!rawCode) return '';

  const blockKeywords = new Set(['ALVOS', 'QUANDO', 'SE', 'COMO', 'ENTÃO', 'SENÃO']);

  let lines = rawCode.split('\n');

  // Strip leading empty lines
  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }

  // Strip trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  let inBlock = false;
  let inItem = false;
  const formatted: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const originalLine = lines[i];
    const trimmed = originalLine.trim();

    if (trimmed === '') {
      formatted.push('');
      inItem = false;
      continue;
    }

    const upper = trimmed.toUpperCase();
    if (blockKeywords.has(upper)) {
      formatted.push(upper);
      inBlock = true;
      inItem = false;
      continue;
    }

    if (!inBlock) {
      formatted.push(trimmed);
      continue;
    }

    const isBullet = trimmed.startsWith('-');
    const origIndent = originalLine.search(/\S/);

    if (isBullet) {
      formatted.push(`  ${trimmed}`);
      inItem = true;
    } else if (inItem && (origIndent >= 4 || !trimmed.includes(':'))) {
      formatted.push(`    ${trimmed}`);
    } else {
      formatted.push(`  ${trimmed}`);
      inItem = true;
    }
  }

  return formatted.join('\n');
}
