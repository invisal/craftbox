import type { JSX } from 'react';
import { useRef, useState } from 'react';
import { SourcePicker } from '../../features/recording/components/SourcePicker';
import { AudioSourceToggle } from '../../features/recording/components/AudioSourceToggle';
import { ScreenRecordingPermissionBanner } from '../../features/recording/components/ScreenRecordingPermissionBanner';
import { WebcamShapePicker } from '../../features/webcam/components/WebcamShapePicker';
import { useRecordingStore } from '../../features/recording/store/recording-store';
import {
  startCapture,
  fileExtensionForBlob,
  type CaptureHandle
} from '../../features/recording/engine/capture-engine';
import { Button } from '../../components/ui/button';
import { useAppStore } from '../../app/app-store';

export function RecordSetupPage(): JSX.Element {
  const selectedSource = useRecordingStore((state) => state.selectedSource);
  const audio = useRecordingStore((state) => state.audio);
  const isRecording = useAppStore((state) => state.isRecording);
  const setIsRecording = useAppStore((state) => state.setIsRecording);
  const setRoute = useAppStore((state) => state.setRoute);
  const setLastRecording = useAppStore((state) => state.setLastRecording);

  const [error, setError] = useState<string | null>(null);
  const captureRef = useRef<CaptureHandle | null>(null);

  async function handleStart(): Promise<void> {
    if (!selectedSource) {
      setError('Pick a screen or window first.');
      return;
    }
    setError(null);
    try {
      captureRef.current = await startCapture({ source: selectedSource, audio });
      setIsRecording(true);
    } catch (err) {
      // Most likely cause: the user denied the (rare, OS-level) permission
      // prompt, or no capture source is actually available.
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleStop(): Promise<void> {
    const capture = captureRef.current;
    if (!capture) return;
    setIsRecording(false);

    const blob = await capture.stop();
    captureRef.current = null;

    const previewUrl = URL.createObjectURL(blob);
    const extension = fileExtensionForBlob(blob);
    const fileName = `recording-${Date.now()}.${extension}`;

    let filePath: string | null = null;
    try {
      const arrayBuffer = await blob.arrayBuffer();
      filePath = await window.screenStudio.recording.saveFile(fileName, arrayBuffer);
    } catch (err) {
      console.error('[record-setup] failed to save recording to disk:', err);
    }

    setLastRecording({ previewUrl, filePath, sizeBytes: blob.size, createdAt: Date.now() });
    setRoute('editor');
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">New Recording</h1>
      <ScreenRecordingPermissionBanner />
      <SourcePicker />
      <AudioSourceToggle />
      <WebcamShapePicker />

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div>
        {isRecording ? (
          <Button variant="secondary" onClick={handleStop}>
            Stop Recording
          </Button>
        ) : (
          <Button onClick={handleStart} disabled={!selectedSource}>
            Start Recording
          </Button>
        )}
      </div>
    </div>
  );
}
