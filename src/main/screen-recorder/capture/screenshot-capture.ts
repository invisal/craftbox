import { desktopCapturer, screen } from 'electron';

export interface ScreenshotCaptureRequest {
  sourceId: string;
  width: number;
  height: number;
}

function defaultCaptureSize(): { width: number; height: number } {
  const display = screen.getPrimaryDisplay();
  return {
    width: Math.round(display.bounds.width * display.scaleFactor),
    height: Math.round(display.bounds.height * display.scaleFactor)
  };
}

/** Captures a chosen screen/window as PNG bytes via desktopCapturer thumbnails. */
export async function captureSourcePng(request: ScreenshotCaptureRequest): Promise<Buffer> {
  const fallback = defaultCaptureSize();
  const width = request.width > 0 ? request.width : fallback.width;
  const height = request.height > 0 ? request.height : fallback.height;

  const isScreen = request.sourceId.startsWith('screen');
  const sources = await desktopCapturer.getSources({
    types: isScreen ? ['screen'] : ['window'],
    thumbnailSize: { width, height }
  });

  const source = sources.find((item) => item.id === request.sourceId);
  if (!source) throw new Error('Capture source not found.');

  const png = source.thumbnail.toPNG();
  if (!png.length) throw new Error('Captured screenshot is empty.');

  return png;
}
