import { desktopCapturer, session } from 'electron';
import { usesOsCapturePicker } from '@shared/uses-os-capture-picker';

/** Routes getDisplayMedia to the OS picker (PipeWire portal on Wayland). */
export function registerDisplayMediaHandler(): void {
  session.defaultSession.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      if (usesOsCapturePicker()) {
        // PipeWire shows its own picker when capture starts — getSources() would
        // open a redundant portal session that can't be reused for the stream.
        callback({ video: { id: 'screen:0:0', name: 'Entire Screen' } });
        return;
      }

      const sources = await desktopCapturer.getSources({
        types: ['screen', 'window'],
        thumbnailSize: { width: 0, height: 0 }
      });
      callback({ video: sources[0] ?? null });
    },
    { useSystemPicker: true }
  );
}
