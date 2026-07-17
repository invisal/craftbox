import type { CaptureTargetType } from '@screen-recorder/types/recording';

/**
 * The full-desktop click-to-record overlay opened from the focus toolbar's
 * Display/Window tabs (see main/screen-recorder/windows/
 * source-picker-overlay-window.ts). For 'screen', we have exact bounds for
 * every display, so it draws one real, correctly-positioned "Start
 * Recording" panel per display. For 'window', desktopCapturer gives us no
 * on-screen position for arbitrary windows, so it falls back to a
 * best-effort thumbnail grid instead of a true per-window overlay.
 */
export interface SourcePickerOverlayOpenOptions {
  type: CaptureTargetType;
}

export interface SourcePickerOverlayInit extends SourcePickerOverlayOpenOptions {
  /**
   * Top-left of the overlay window itself, in global screen coordinates --
   * the overlay spans the whole virtual desktop, but CaptureSource.displayBounds
   * is also in global coordinates, so the renderer needs this to convert a
   * display's bounds into a CSS-relative position for its panel.
   */
  origin: { x: number; y: number };
}
