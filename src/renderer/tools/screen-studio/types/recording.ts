export type CaptureTargetType = 'screen' | 'window';

export interface CaptureSource {
  id: string;
  name: string;
  type: CaptureTargetType;
  thumbnailDataUrl: string;
  displayId?: string;
  /**
   * Screen bounds in OS screen-coordinate space, present only for `type:
   * 'screen'` sources. Lets the main process normalize
   * `screen.getCursorScreenPoint()` samples to 0-1 fractions of the captured
   * area during cursor tracking. Unavailable for `'window'` sources (a
   * window can move/resize during capture), so those never produce a
   * cursor path.
   */
  displayBounds?: { x: number; y: number; width: number; height: number };
}

export interface AudioInputOptions {
  microphoneEnabled: boolean;
  microphoneDeviceId?: string;
  systemAudioEnabled: boolean;
}

export interface WebcamOptions {
  enabled: boolean;
  deviceId?: string;
  shape: 'circle' | 'rounded-square' | 'square';
  mirrored: boolean;
  position: { x: number; y: number };
  size: number;
}

export interface RecordingRequest {
  source: CaptureSource;
  audio: AudioInputOptions;
  webcam: WebcamOptions;
}

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'paused' | 'processing';

export interface RecordingSession {
  id: string;
  state: RecordingState;
  startedAt?: number;
  request: RecordingRequest;
}
