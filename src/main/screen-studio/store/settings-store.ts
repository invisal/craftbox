import Store from 'electron-store';
import { DefaultShortcuts } from 'src/renderer/tools/screen-studio/types/shortcuts';

interface AppSettings {
  shortcuts: typeof DefaultShortcuts;
  defaultExportFormat: 'mp4' | 'gif';
}

export const settingsStore = new Store<AppSettings>({
  defaults: {
    shortcuts: DefaultShortcuts,
    defaultExportFormat: 'mp4'
  }
});
