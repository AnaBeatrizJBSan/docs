export interface WebVttCue {
  identifier?: string;
  startTime: string;
  endTime: string;
  settings?: string;
  text: string;
}

const TIMING_LINE_PATTERN =
  /^((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}\.\d{3})(?:\s+(.*))?$/;

function cleanCueText(text: string): string {
  return text
    .replace(/<v(?:\.[^ >]+)*(?:\s+[^>]+)?>/gi, "")
    .replace(/<\/v>/gi, "")
    .replace(/<c(?:\.[^ >]+)*>/gi, "")
    .replace(/<\/c>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseWebVtt(source: string): WebVttCue[] {
  const normalizedSource = source
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!normalizedSource.startsWith("WEBVTT")) {
    throw new Error("Invalid WebVTT file: WEBVTT header not found.");
  }

  const blocks = normalizedSource.split(/\n{2,}/);
  const cues: WebVttCue[] = [];

  for (const block of blocks.slice(1)) {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      continue;
    }

    const firstLine = lines[0];

    if (
      firstLine === "STYLE" ||
      firstLine === "REGION" ||
      firstLine.startsWith("NOTE")
    ) {
      continue;
    }

    let identifier: string | undefined;
    let timingLineIndex = 0;

    if (!lines[0].includes("-->")) {
      identifier = lines[0];
      timingLineIndex = 1;
    }

    const timingLine = lines[timingLineIndex];

    if (!timingLine) {
      continue;
    }

    const timingMatch = timingLine.match(TIMING_LINE_PATTERN);

    if (!timingMatch) {
      continue;
    }

    const text = cleanCueText(
      lines.slice(timingLineIndex + 1).join(" "),
    );

    if (!text) {
      continue;
    }

    cues.push({
      identifier,
      startTime: timingMatch[1],
      endTime: timingMatch[2],
      settings: timingMatch[3]?.trim() || undefined,
      text,
    });
  }

  return cues;
}