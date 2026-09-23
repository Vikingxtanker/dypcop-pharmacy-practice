export const COUNSELING_MAX_LINES = 5;
export const COUNSELING_MAX_CHARS = 103;
export const COUNSELING_TOTAL_CAPACITY = COUNSELING_MAX_LINES * COUNSELING_MAX_CHARS;
export const COUNSELING_LIMIT_MESSAGE =
  "Maximum character limit reached. Counseling points are limited to 5 lines of 103 characters each.";

export interface CounselingEnforced {
  value: string;
  lines: string[];
  truncated: boolean;
  caret: number;
}

export interface CounselingStatus {
  lineCount: number;
  currentChars: number;
  totalChars: number;
}

const isSpaceChar = (ch: string) => /\s/.test(ch);

function splitSegments(value: string): { text: string; start: number }[] {
  const segments: { text: string; start: number }[] = [];
  let start = 0;
  for (let i = 0; i <= value.length; i++) {
    if (i === value.length || value[i] === "\n") {
      segments.push({ text: value.slice(start, i), start });
      start = i + 1;
    }
  }
  return segments;
}

function chunkWord(word: string, max: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < word.length; i += max) chunks.push(word.slice(i, i + max));
  return chunks;
}

function wrapSegment(seg: { text: string; start: number }): number[][] {
  const { text: t, start: base } = seg;
  const n = t.length;
  const lines: number[][] = [];
  let line: number[] = [];
  let lineLen = 0;
  let i = 0;

  while (i < n) {
    let ws = i;
    while (ws < n && isSpaceChar(t[ws])) ws++;
    const gapSrc = ws > i ? base + i : -1;
    const wStart = ws;
    let wEnd = wStart;
    while (wEnd < n && !isSpaceChar(t[wEnd])) wEnd++;
    if (wEnd === wStart) break;

    const pieces = chunkWord(t.slice(wStart, wEnd), COUNSELING_MAX_CHARS);
    let pieceOffset = 0;
    let firstPiece = true;
    const wSrc = base + wStart;

    for (const piece of pieces) {
      let sep = firstPiece && gapSrc >= 0 && line.length > 0;
      const extra = sep ? 1 : 0;
      if (line.length > 0 && lineLen + extra + piece.length > COUNSELING_MAX_CHARS) {
        lines.push(line);
        line = [];
        lineLen = 0;
        sep = false;
      }
      if (sep) {
        line.push(gapSrc);
        lineLen += 1;
      }
      for (let k = 0; k < piece.length; k++) line.push(wSrc + pieceOffset + k);
      lineLen += piece.length;
      pieceOffset += piece.length;
      firstPiece = false;
    }

    i = wEnd;
  }

  if (line.length > 0) lines.push(line);
  return lines;
}

function rangeIndices(start: number, length: number): number[] {
  const arr: number[] = [];
  for (let k = 0; k < length; k++) arr.push(start + k);
  return arr;
}

export function enforceCounselingLimit(value: string, caret = value.length): CounselingEnforced {
  const segments = splitSegments(value);

  let valid = true;
  if (segments.length > COUNSELING_MAX_LINES) {
    valid = false;
  } else {
    for (const seg of segments) {
      if (seg.text.length > COUNSELING_MAX_CHARS) {
        valid = false;
        break;
      }
    }
  }
  if (valid) {
    return { value, lines: value.split("\n"), truncated: false, caret };
  }

  const cursorMap = new Array<number>(value.length).fill(-1);
  const physical: { inds: number[]; newlineSrc: number | null }[] = [];

  outer: for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    const wrapped =
      seg.text.length === 0
        ? [[]]
        : seg.text.length <= COUNSELING_MAX_CHARS
          ? [rangeIndices(seg.start, seg.text.length)]
          : wrapSegment(seg);

    for (let wi = 0; wi < wrapped.length; wi++) {
      if (physical.length >= COUNSELING_MAX_LINES) break outer;
      physical.push({ inds: wrapped[wi], newlineSrc: wi === 0 && si > 0 ? seg.start - 1 : null });
    }
  }

  let out = "";
  for (let li = 0; li < physical.length; li++) {
    if (li > 0) out += "\n";
    const ph = physical[li];
    if (ph.newlineSrc !== null) cursorMap[ph.newlineSrc] = out.length - 1;
    for (const srcIdx of ph.inds) {
      cursorMap[srcIdx] = out.length;
      out += value[srcIdx];
    }
  }

  let truncated = false;
  for (let k = 0; k < value.length; k++) {
    if (cursorMap[k] === -1 && !isSpaceChar(value[k])) {
      truncated = true;
      break;
    }
  }

  let newCaret: number;
  if (caret >= value.length) newCaret = out.length;
  else if (cursorMap[caret] >= 0) newCaret = cursorMap[caret];
  else {
    let k = caret - 1;
    while (k >= 0 && cursorMap[k] < 0) k--;
    newCaret = k >= 0 ? cursorMap[k] + 1 : 0;
  }

  return { value: out, lines: out.split("\n"), truncated, caret: newCaret };
}

export function counselingStatus(value: string): CounselingStatus {
  const lines = value.split("\n");
  const last = lines[lines.length - 1];
  return {
    lineCount: lines.length,
    currentChars: last.length,
    totalChars: value.length,
  };
}