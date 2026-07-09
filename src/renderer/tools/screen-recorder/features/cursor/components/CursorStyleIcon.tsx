import type { JSX } from 'react';

interface CursorStyleIconProps {
  fill: string;
  stroke: string;
  size?: number;
}

/**
 * The classic angled arrow-pointer glyph, in the given fill/outline colors.
 * Shared shape between the settings grid, the live preview overlay, and (via
 * the same path data mirrored in node-canvas) the export compositor.
 */
export function CursorStyleIcon({ fill, stroke, size = 22 }: CursorStyleIconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M5 3 L5 20.5 L9.5 16.2 L12.3 21.8 L15 20.4 L12.1 14.8 L18.5 14.5 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}
