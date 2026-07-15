import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const PORTAL_SERVICE = 'org.freedesktop.portal.Desktop';
const PORTAL_PATH = '/org/freedesktop/portal/desktop';
const SCREENSHOT_IFACE = 'org.freedesktop.portal.Screenshot';
const REQUEST_IFACE = 'org.freedesktop.portal.Request';
/** Interactive dialog waits on the user; guard against a wedged compositor so the app is never left hidden forever. */
const RESPONSE_TIMEOUT_MS = 180_000;

/**
 * Wayland region/window capture via xdg-desktop-portal's interactive
 * Screenshot API. Wayland forbids ordinary clients from reading the raw
 * framebuffer or drawing a global overlay, so instead of grabbing pixels
 * ourselves we ask the *compositor* to run its own selection UI and hand back
 * only the chosen image -- the same mechanism GNOME/KDE's built-in screenshot
 * tools use, which is why it looks native and keeps the screen's real colors.
 *
 * dbus-next (and its deps) is loaded lazily here so it never touches the
 * macOS/Windows startup path. Returns the PNG bytes, or null if the user
 * cancelled. Throws if no session bus / Screenshot portal is present, which is
 * the caller's signal to fall back to the getUserMedia + backdrop flow.
 */
export async function captureInteractiveRegionWayland(): Promise<Buffer | null> {
  const { sessionBus, Variant } = await import('dbus-next');
  const bus = sessionBus();
  try {
    const portal = await bus.getProxyObject(PORTAL_SERVICE, PORTAL_PATH);
    const screenshot = portal.getInterface(SCREENSHOT_IFACE);

    // The result arrives asynchronously as a Response signal on a Request
    // object. interactive:true is safe to subscribe to after the call returns
    // the handle: the signal only fires once the user finishes selecting, long
    // after we have attached the listener.
    const token = `craftbox_${Date.now()}`;
    const handle: string = await screenshot.Screenshot('', {
      interactive: new Variant('b', true),
      handle_token: new Variant('s', token)
    });

    const requestObj = await bus.getProxyObject(PORTAL_SERVICE, handle);
    const request = requestObj.getInterface(REQUEST_IFACE);

    const uri = await new Promise<string | null>((resolve, reject) => {
      const timer = setTimeout(() => {
        request.removeAllListeners('Response');
        reject(new Error('Screenshot portal timed out'));
      }, RESPONSE_TIMEOUT_MS);

      request.on('Response', (code: number, results: { uri?: { value: string } }) => {
        clearTimeout(timer);
        // 0 = success, 1 = user cancelled, 2 = other termination.
        resolve(code === 0 ? (results.uri?.value ?? null) : null);
      });
    });

    if (!uri) return null;
    return await readFile(fileURLToPath(uri));
  } finally {
    bus.disconnect();
  }
}
