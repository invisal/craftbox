import { ipcMain } from 'electron';
import { IpcChannels } from '@shared/ipc-channels';
import { settingsStore } from '../store/settings-store';

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannels.GetSettings, () => settingsStore.store);
  ipcMain.handle(IpcChannels.SetSettings, (_event, patch: Record<string, unknown>) => {
    settingsStore.set(patch);
    return settingsStore.store;
  });
}
