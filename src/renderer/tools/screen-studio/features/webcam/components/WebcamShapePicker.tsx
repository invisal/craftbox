import type { JSX } from 'react';
import { useWebcamStore } from '../store/webcam-store';

export function WebcamShapePicker(): JSX.Element {
  const { shape, setShape, mirrored, setMirrored } = useWebcamStore();

  return (
    <div className="flex items-center gap-3">
      {(['circle', 'rounded-square', 'square'] as const).map((option) => (
        <button
          key={option}
          onClick={() => setShape(option)}
          className={`rounded-lg border px-3 py-1 text-xs ${
            shape === option ? 'border-accent text-accent' : 'border-white/10'
          }`}
        >
          {option}
        </button>
      ))}
      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={mirrored} onChange={(e) => setMirrored(e.target.checked)} />
        Mirror
      </label>
    </div>
  );
}
