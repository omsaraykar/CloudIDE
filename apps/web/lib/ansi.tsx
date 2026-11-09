import React from 'react';

// Standard 16 ANSI colors
const COLOR_MAP: Record<number, string> = {
  30: '#1e293b', // black
  31: '#f87171', // red
  32: '#4ade80', // green
  33: '#facc15', // yellow
  34: '#60a5fa', // blue
  35: '#c084fc', // magenta
  36: '#38bdf8', // cyan
  37: '#f1f5f9', // white
  90: '#94a3b8', // bright black / gray
  91: '#ef4444', // bright red
  92: '#22c55e', // bright green
  93: '#eab308', // bright yellow
  94: '#3b82f6', // bright blue
  95: '#a855f7', // bright magenta
  96: '#06b6d4', // bright cyan
  97: '#ffffff', // bright white
};

const BG_COLOR_MAP: Record<number, string> = {
  40: '#020617',
  41: '#991b1b',
  42: '#166534',
  43: '#854d0e',
  44: '#1e40af',
  45: '#6b21a8',
  46: '#155e75',
  47: '#e2e8f0',
  100: '#334155',
  101: '#dc2626',
  102: '#16a34a',
  103: '#ca8a04',
  104: '#2563eb',
  105: '#9333ea',
  106: '#0891b2',
  107: '#f8fafc',
};

function get256Color(index: number): string {
  if (index < 8) {
    return COLOR_MAP[30 + index] || '#ffffff';
  }
  if (index < 16) {
    return COLOR_MAP[90 + (index - 8)] || '#ffffff';
  }
  if (index >= 16 && index <= 231) {
    const code = index - 16;
    const r = Math.floor(code / 36);
    const g = Math.floor((code % 36) / 6);
    const b = code % 6;
    const toHex = (n: number) => (n === 0 ? 0 : 55 + n * 40);
    return `rgb(${toHex(r)}, ${toHex(g)}, ${toHex(b)})`;
  }
  if (index >= 232 && index <= 255) {
    const gray = 8 + (index - 232) * 10;
    return `rgb(${gray}, ${gray}, ${gray})`;
  }
  return '#ffffff';
}

/**
 * Strips all ANSI escape sequences and non-printable control characters from text.
 */
export function stripAnsi(text: string): string {
  if (!text) return '';
  return text
    // CSI escape sequences
    .replace(/\u001b\[[0-9;?]*[a-zA-Z]/g, '')
    // OSC escape sequences
    .replace(/\u001b\][^\u0007\u001b]*(\u0007|\u001b\\)/g, '')
    // Other escape characters
    .replace(/\u001b[PX^_][^\u001b]*\u001b\\/g, '')
    // Strip standalone ESC or unprintable control characters except \t and \n
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');
}

interface SpanStyle {
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  opacity?: number;
}

/**
 * Parses ANSI-formatted string into an array of styled React spans.
 * Correctly strips escape codes and maps colors (including console.table yellow numbers).
 */
export function renderAnsi(text: string): React.ReactNode[] {
  if (!text) return [];

  // Remove non-SGR control sequences first (cursor movement, clear line/screen, window titles)
  const sanitized = text
    .replace(/\u001b\][^\u0007\u001b]*(\u0007|\u001b\\)/g, '')
    .replace(/\u001b\[\?[0-9;]*[a-zA-Z]/g, '')
    .replace(/\u001b\[[0-9;]*[A-HJ-Za-ln-z]/g, '')
    .replace(/[\u0000-\u0008\u000B-\u001A\u001C-\u001F\u007F]/g, '');

  // Split text by SGR ANSI codes: \u001b[...m
  const regex = /\u001b\[([0-9;]*)m/g;
  const nodes: React.ReactNode[] = [];

  let lastIndex = 0;
  let currentStyle: SpanStyle = {};
  let match: RegExpExecArray | null;
  let keyIndex = 0;

  while ((match = regex.exec(sanitized)) !== null) {
    const textChunk = sanitized.slice(lastIndex, match.index);
    if (textChunk) {
      nodes.push(
        <span
          key={`ansi-${keyIndex++}`}
          style={{
            color: currentStyle.color,
            backgroundColor: currentStyle.backgroundColor,
            fontWeight: currentStyle.fontWeight,
            fontStyle: currentStyle.fontStyle,
            textDecoration: currentStyle.textDecoration,
            opacity: currentStyle.opacity,
          }}
        >
          {textChunk}
        </span>
      );
    }

    lastIndex = regex.lastIndex;

    const rawCodes = match[1] ? match[1].split(';').map((c) => parseInt(c, 10)) : [0];

    for (let i = 0; i < rawCodes.length; i++) {
      const code = rawCodes[i];
      if (isNaN(code) || code === 0) {
        currentStyle = {};
      } else if (code === 1) {
        currentStyle.fontWeight = 'bold';
      } else if (code === 2) {
        currentStyle.opacity = 0.7;
      } else if (code === 3) {
        currentStyle.fontStyle = 'italic';
      } else if (code === 4) {
        currentStyle.textDecoration = 'underline';
      } else if (code === 9) {
        currentStyle.textDecoration = 'line-through';
      } else if (code === 22) {
        currentStyle.fontWeight = undefined;
        currentStyle.opacity = undefined;
      } else if (code === 23) {
        currentStyle.fontStyle = undefined;
      } else if (code === 24 || code === 29) {
        currentStyle.textDecoration = undefined;
      } else if (code === 39) {
        currentStyle.color = undefined;
      } else if (code === 49) {
        currentStyle.backgroundColor = undefined;
      } else if (COLOR_MAP[code]) {
        currentStyle.color = COLOR_MAP[code];
      } else if (BG_COLOR_MAP[code]) {
        currentStyle.backgroundColor = BG_COLOR_MAP[code];
      } else if (code === 38) {
        // Extended foreground color: 38;5;n or 38;2;r;g;b
        if (rawCodes[i + 1] === 5 && rawCodes[i + 2] !== undefined) {
          currentStyle.color = get256Color(rawCodes[i + 2]);
          i += 2;
        } else if (
          rawCodes[i + 1] === 2 &&
          rawCodes[i + 2] !== undefined &&
          rawCodes[i + 3] !== undefined &&
          rawCodes[i + 4] !== undefined
        ) {
          currentStyle.color = `rgb(${rawCodes[i + 2]}, ${rawCodes[i + 3]}, ${rawCodes[i + 4]})`;
          i += 4;
        }
      } else if (code === 48) {
        // Extended background color: 48;5;n or 48;2;r;g;b
        if (rawCodes[i + 1] === 5 && rawCodes[i + 2] !== undefined) {
          currentStyle.backgroundColor = get256Color(rawCodes[i + 2]);
          i += 2;
        } else if (
          rawCodes[i + 1] === 2 &&
          rawCodes[i + 2] !== undefined &&
          rawCodes[i + 3] !== undefined &&
          rawCodes[i + 4] !== undefined
        ) {
          currentStyle.backgroundColor = `rgb(${rawCodes[i + 2]}, ${rawCodes[i + 3]}, ${rawCodes[i + 4]})`;
          i += 4;
        }
      }
    }
  }

  // Push remaining text
  const remaining = sanitized.slice(lastIndex);
  if (remaining) {
    nodes.push(
      <span
        key={`ansi-${keyIndex++}`}
        style={{
          color: currentStyle.color,
          backgroundColor: currentStyle.backgroundColor,
          fontWeight: currentStyle.fontWeight,
          fontStyle: currentStyle.fontStyle,
          textDecoration: currentStyle.textDecoration,
          opacity: currentStyle.opacity,
        }}
      >
        {remaining}
      </span>
    );
  }

  return nodes;
}
