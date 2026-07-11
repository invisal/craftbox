const isMac = navigator.platform.toUpperCase().includes('MAC');

export type Modifier = 'ctrl' | 'alt' | 'shift' | 'mod';

export interface ParsedShortcut {
  modifiers: Modifier[];
  key: string;
}

// Mac: ⌃⌥⇧⌘, Windows/Linux: Ctrl+Alt+Shift — same order VS Code uses on both platforms.
const MODIFIER_ORDER: Modifier[] = ['ctrl', 'alt', 'shift', 'mod'];

const MAC_SYMBOL: Record<Modifier, string> = { ctrl: '⌃', alt: '⌥', shift: '⇧', mod: '⌘' };
const WIN_LABEL: Record<Modifier, string> = {
  ctrl: 'Ctrl',
  alt: 'Alt',
  shift: 'Shift',
  mod: 'Ctrl'
};

const MAC_KEY_LABEL: Record<string, string> = {
  delete: '⌫',
  enter: '⏎',
  esc: 'Esc',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→'
};

const WIN_KEY_LABEL: Record<string, string> = {
  delete: 'Del',
  enter: 'Enter',
  esc: 'Esc',
  up: '↑',
  down: '↓',
  left: '←',
  right: '→'
};

// "mod" means "the primary modifier" (⌘ on Mac, Ctrl elsewhere) — the one nearly
// every shortcut needs. `ctrl` stays literal since it's a distinct physical key
// on Mac (⌃) from `mod` (⌘), unlike on Windows/Linux where they're the same key.
export function parseShortcut(shortcut: string): ParsedShortcut {
  const tokens = shortcut.toLowerCase().split('+');
  const key = tokens.pop()!;
  const modifiers = MODIFIER_ORDER.filter((m) => tokens.includes(m));
  return { modifiers, key };
}

export function formatShortcut(shortcut: string): string {
  const { modifiers, key } = parseShortcut(shortcut);
  const keyLabel = (isMac ? MAC_KEY_LABEL : WIN_KEY_LABEL)[key] ?? key.toUpperCase();

  return isMac
    ? modifiers.map((m) => MAC_SYMBOL[m]).join('') + keyLabel
    : [...modifiers.map((m) => WIN_LABEL[m]), keyLabel].join('+');
}
