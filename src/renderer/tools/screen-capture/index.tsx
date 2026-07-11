import type { JSX } from 'react';
import { useState } from 'react';
import { Camera, ClipboardCopy, Download } from 'lucide-react';
import { ToolComponentProps } from '@renderer/components/providers/createTabProvider';
import { Button } from '@renderer/components/ui/Button';
import { ScreenRecordingPermissionBanner } from '@screen-recorder/features/recording/components/ScreenRecordingPermissionBanner';
import { captureFrame, blobToDataUrl, screenshotFileName } from './lib/capture-frame';

interface Props {}

type Phase = 'idle' | 'capturing' | 'result';

const PRELOAD_MISSING_ERROR =
  'Capture API unavailable (preload script did not load). Check the console.';

async function copyToClipboard(blob: Blob): Promise<void> {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  } catch {
    // Clipboard API unavailable/denied - nothing else to fall back to.
  }
}

// eslint-disable-next-line no-empty-pattern
export function ScreenCaptureMain({}: ToolComponentProps<Props>): JSX.Element {
  const [phase, setPhase] = useState<Phase>('idle');
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartCapture = (): void => {
    setPhase('capturing');
    setPreviewDataUrl(null);
    setPreviewBlob(null);
    setError(null);

    const run = async (): Promise<void> => {
      try {
        if (!window.screenRecorder) throw new Error(PRELOAD_MISSING_ERROR);

        const sources = await window.screenRecorder.recording.getCaptureSources();
        if (sources.length === 0) throw new Error('No capture sources found.');

        // ponytail: always grabs the first listed source; add picker later if needed
        const blob = await captureFrame(sources[0]);
        const dataUrl = await blobToDataUrl(blob);
        await copyToClipboard(blob);
        setPreviewBlob(blob);
        setPreviewDataUrl(dataUrl);
        setPhase('result');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setPhase('idle');
      }
    };

    void run();
  };

  const handleCaptureAgain = (): void => {
    setPhase('idle');
    setPreviewDataUrl(null);
    setPreviewBlob(null);
    setError(null);
  };

  const handleCopy = (): void => {
    if (!previewBlob) return;
    void copyToClipboard(previewBlob);
  };

  const handleSave = async (): Promise<void> => {
    if (!previewBlob || !window.screenRecorder) return;

    try {
      const arrayBuffer = await previewBlob.arrayBuffer();
      await window.screenRecorder.screenshot.save(arrayBuffer, screenshotFileName());
    } catch {
      // Save dialog cancelled or write failed - stay silent.
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface text-text-base">
      <div className="shrink-0 border-b border-border-dark px-6 py-4">
        <h1 className="text-base font-medium">Screen Capture</h1>
        <p className="mt-0.5 text-xs text-text-dim">
          {phase === 'idle' && 'Take a screenshot of your screen or a window.'}
          {phase === 'capturing' && 'Capturing…'}
          {phase === 'result' && 'Save your screenshot or capture again.'}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-6">
        {phase === 'idle' && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <ScreenRecordingPermissionBanner />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button variant="primary" onClick={handleStartCapture}>
              <Camera size={14} />
              Capture
            </Button>
          </div>
        )}

        {phase === 'capturing' && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-text-dim">Capturing…</p>
          </div>
        )}

        {phase === 'result' && previewDataUrl && (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <img
              src={previewDataUrl}
              alt="Captured screenshot"
              className="min-h-0 flex-1 object-contain"
            />

            <div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
              <Button variant="secondary" onClick={handleCopy}>
                <ClipboardCopy size={14} />
                Copy to clipboard
              </Button>
              <Button variant="secondary" onClick={() => void handleSave()}>
                <Download size={14} />
                Save to file
              </Button>
              <Button variant="primary" onClick={handleCaptureAgain}>
                <Camera size={14} />
                Capture again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScreenCaptureMain;
