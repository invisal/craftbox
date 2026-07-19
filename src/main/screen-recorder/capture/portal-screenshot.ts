import { randomBytes } from 'crypto';
import { readFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';
import dbus from '@homebridge/dbus-native';

const PORTAL_SERVICE = 'org.freedesktop.portal.Desktop';
const PORTAL_OBJECT_PATH = '/org/freedesktop/portal/desktop';
const SCREENSHOT_IFACE = 'org.freedesktop.portal.Screenshot';
const REQUEST_IFACE = 'org.freedesktop.portal.Request';

/** [key, [parsedSignatureTree, [value]]] — how this library reads a{sv} dict entries on the wire. */
type VariantEntry = [string, [unknown, [unknown]]];

interface DBusMessage {
  destination?: string;
  path?: string;
  interface?: string;
  member?: string;
  signature?: string;
  body?: unknown[];
}

interface DBusCallError {
  name?: string;
  message?: string;
}

interface PortalBus {
  invoke(
    msg: DBusMessage,
    callback: (err: DBusCallError | null, ...results: unknown[]) => void
  ): void;
  addMatch(match: string, callback: (err: DBusCallError | null) => void): void;
  removeMatch(match: string, callback?: (err: DBusCallError | null) => void): void;
  mangle(path: string, iface: string, member: string): string;
  signals: {
    on(event: string, listener: (body: unknown[]) => void): void;
    removeListener(event: string, listener: (body: unknown[]) => void): void;
  };
}

// The published typings for this package only declare `systemBus()`, not the
// `sessionBus()` we actually need — cast once here instead of sprinkling `any`.
const dbusModule = dbus as unknown as { sessionBus(): PortalBus };

let cachedBus: PortalBus | null = null;

// ponytail: one session-bus connection cached for the process lifetime. If the
// session bus ever drops (rare — user session restart, dbus-daemon crash), the
// next capture will fail until CraftBox restarts. Reconnect-on-drop is not
// implemented.
function getBus(): PortalBus {
  if (!cachedBus) cachedBus = dbusModule.sessionBus();
  return cachedBus;
}

function invokeMethod(bus: PortalBus, msg: DBusMessage): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    bus.invoke(msg, (err, ...results) => {
      if (err) reject(new Error(err.message || err.name || 'D-Bus call failed.'));
      else resolve(results);
    });
  });
}

function findVariant(entries: VariantEntry[], key: string): unknown {
  const entry = entries.find(([entryKey]) => entryKey === key);
  return entry ? entry[1][1][0] : undefined;
}

/** Waits for the portal's async Request.Response signal on the handle returned by Screenshot(). */
function waitForResponse(
  bus: PortalBus,
  requestPath: string,
  timeoutMs: number
): Promise<[number, VariantEntry[]]> {
  return new Promise((resolve, reject) => {
    const match = `type='signal',path='${requestPath}',interface='${REQUEST_IFACE}',member='Response'`;
    const signalKey = bus.mangle(requestPath, REQUEST_IFACE, 'Response');
    let settled = false;

    const cleanup = (): void => {
      clearTimeout(timer);
      bus.signals.removeListener(signalKey, onSignal);
      bus.removeMatch(match);
    };

    const onSignal = (body: unknown[]): void => {
      if (settled) return;
      settled = true;
      cleanup();
      const [responseCode, results] = body as [number, VariantEntry[]];
      resolve([responseCode, results ?? []]);
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Timed out waiting for the system screenshot dialog.'));
    }, timeoutMs);

    bus.addMatch(match, (err) => {
      if (err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(new Error(err.message || 'Failed to subscribe to the portal response.'));
        return;
      }
      if (!settled) bus.signals.on(signalKey, onSignal);
    });
  });
}

/**
 * Takes a screenshot via the xdg-desktop-portal Screenshot interface — the same
 * mechanism Flameshot/Snipaste use on modern GNOME, since the private
 * `org.gnome.Shell.Screenshot` API is blocked for third-party callers (GNOME 41+).
 * Always interactive: GNOME shows its own screen/window/selection picker UI and
 * returns whatever the user captured — CraftBox never picks on the user's behalf.
 *
 * Returns null if the user cancelled (or the portal denied the request).
 */
export async function captureViaPortal(): Promise<Buffer | null> {
  const bus = getBus();
  const token = `craftbox${randomBytes(8).toString('hex')}`;

  const [requestPath] = (await invokeMethod(bus, {
    destination: PORTAL_SERVICE,
    path: PORTAL_OBJECT_PATH,
    interface: SCREENSHOT_IFACE,
    member: 'Screenshot',
    signature: 'sa{sv}',
    body: [
      '',
      [
        ['handle_token', ['s', token]],
        ['interactive', ['b', true]]
      ]
    ]
  })) as [string];

  const [responseCode, results] = await waitForResponse(bus, requestPath, 90_000);

  if (responseCode !== 0) return null;

  const uri = findVariant(results, 'uri');
  if (typeof uri !== 'string') {
    throw new Error('Portal screenshot response had no uri.');
  }

  const filePath = fileURLToPath(uri);
  try {
    const buffer = await readFile(filePath);
    if (!buffer.length) throw new Error('Portal screenshot file was empty.');
    return buffer;
  } finally {
    await rm(filePath, { force: true }).catch(() => undefined);
  }
}
