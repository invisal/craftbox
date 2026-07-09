import { ElectronAPI } from '@electron-toolkit/preload';
import type { ScreenRecorderApi } from './screen-recorder/api';
import type { PostmanBridge } from './postman/api';

declare global {
  interface Window {
    electron: ElectronAPI;
    screenRecorder: ScreenRecorderApi;
    api: {
      platform: string;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      openDirectory: () => Promise<{
        path: string;
        tree: {
          name: string;
          path: string;
          isDirectory: boolean;
          children?: Array<any>;
        } | null;
      } | null>;
    } & PostmanBridge;
  }
}
