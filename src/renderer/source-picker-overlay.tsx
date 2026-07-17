import './src/assets/main.css';
import './source-picker-overlay/overlay.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SourcePickerOverlayApp } from './source-picker-overlay/SourcePickerOverlayApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SourcePickerOverlayApp />
  </StrictMode>
);
