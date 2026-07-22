import {
  app,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  BrowserWindow,
  type MenuItemConstructorOptions
} from 'electron';
import { IpcChannels } from '@shared/ipc-channels';

/**
 * Tray icon quick-access for the screen recorder: clicking it pops up a
 * native menu with a single "Record Screen" entry that focuses the app and
 * opens the floating recorder toolbar, ready to start recording.
 *
 * Only lives while the Screen Recorder tool tab is open -- the renderer
 * (TrayBridge) tells us via IPC when to create/destroy it, rather than the
 * tray existing for the app's whole lifetime regardless of what's in use.
 * Kept as module state (not the returned value of a function) because
 * Electron destroys the OS-level tray icon if the `Tray` instance is
 * garbage collected.
 */
let trayInstance: Tray | null = null;

function createRecorderTray(iconPath: string, mainWindow: BrowserWindow): Tray {
  const image = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
  const tray = new Tray(image);
  tray.setToolTip('benpocket -- click to record');

  tray.on('click', () => {
    showRecordMenu(tray, mainWindow);
  });

  return tray;
}

/** Wires up the renderer-facing register/unregister IPC for the recorder tray. */
export function registerTrayHandlers(iconPath: string): void {
  ipcMain.handle(IpcChannels.TrayRegister, (event) => {
    if (trayInstance) return;
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;
    trayInstance = createRecorderTray(iconPath, win);
  });

  ipcMain.handle(IpcChannels.TrayUnregister, () => {
    trayInstance?.destroy();
    trayInstance = null;
  });
}

/** Tears down the tray icon, if any. Call on app quit. */
export function destroyTray(): void {
  trayInstance?.destroy();
  trayInstance = null;
}

function focusAndSend(mainWindow: BrowserWindow, channel: string, ...args: unknown[]): void {
  if (mainWindow.isDestroyed()) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send(channel, ...args);
}

function showRecordMenu(tray: Tray, mainWindow: BrowserWindow): void {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Record Screen',
      click: () => focusAndSend(mainWindow, IpcChannels.TrayOpenRecordPicker)
    },
    { type: 'separator' },
    { label: 'Quit benpocket', click: () => app.quit() }
  ];

  tray.popUpContextMenu(Menu.buildFromTemplate(template));
}
