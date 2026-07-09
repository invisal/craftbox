import { ElectronAPI } from '@electron-toolkit/preload';
import type { ScreenRecorderApi } from './screen-recorder/api';
import type { PostmanBridge } from './postman/api';
import type { KuberneterApi } from './kuberneter/api';

declare global {
  interface Window {
    electron: ElectronAPI;
    screenRecorder: ScreenRecorderApi;
    kuberneter: KuberneterApi;
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
