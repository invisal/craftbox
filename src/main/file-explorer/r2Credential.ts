import { ipcMain, app, safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

// accessKeyId/secretAccessKey are only needed for R2's S3-compatible API; accountId
// and apiToken alone are enough to use other Cloudflare APIs (e.g. bucket listing).
export interface R2Credential {
  accountId: string;
  apiToken: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  // Buckets the user picked to show in the sidebar/location picker -- we never
  // list the whole account's buckets there, only what was explicitly selected.
  selectedBuckets: string[];
}

const CREDENTIAL_FILENAME = 'r2-credential.json';

function credentialFilePath(): string {
  return path.join(app.getPath('userData'), CREDENTIAL_FILENAME);
}

// accountId isn't secret; the other fields are stored as base64-encoded
// safeStorage ciphertext, never written to disk in plaintext.
interface EncryptedCredentialFile {
  accountId: string;
  apiToken: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  selectedBuckets?: string[];
}

// undefined = not loaded from disk yet; null = loaded, nothing saved.
let cachedCredential: R2Credential | null | undefined;

function loadFromDisk(): R2Credential | null {
  try {
    const raw = fs.readFileSync(credentialFilePath(), 'utf-8');
    const parsed = JSON.parse(raw) as EncryptedCredentialFile;
    return {
      accountId: parsed.accountId,
      apiToken: safeStorage.decryptString(Buffer.from(parsed.apiToken, 'base64')),
      accessKeyId: parsed.accessKeyId
        ? safeStorage.decryptString(Buffer.from(parsed.accessKeyId, 'base64'))
        : undefined,
      secretAccessKey: parsed.secretAccessKey
        ? safeStorage.decryptString(Buffer.from(parsed.secretAccessKey, 'base64'))
        : undefined,
      selectedBuckets: parsed.selectedBuckets ?? []
    };
  } catch {
    return null;
  }
}

function getCachedCredential(): R2Credential | null {
  if (cachedCredential === undefined) {
    cachedCredential = loadFromDisk();
  }
  return cachedCredential;
}

/** Used by R2FileDriver -- never exposed to the renderer directly. */
export function getR2Credential(): R2Credential | null {
  return getCachedCredential();
}

export function registerR2CredentialHandlers(): void {
  ipcMain.handle(
    'file-explorer:get-r2-credential-status',
    (): {
      configured: boolean;
      accountId: string;
      hasAccessKeys: boolean;
      selectedBuckets: string[];
    } => {
      const credential = getCachedCredential();
      return {
        configured: credential !== null,
        // Not secret (see EncryptedCredentialFile) -- safe to send back to the
        // renderer so an edit form can pre-fill it.
        accountId: credential?.accountId ?? '',
        hasAccessKeys: Boolean(credential?.accessKeyId && credential?.secretAccessKey),
        selectedBuckets: credential?.selectedBuckets ?? []
      };
    }
  );

  ipcMain.handle(
    'file-explorer:set-r2-credential',
    (
      _,
      accountId: string,
      apiToken: string,
      accessKeyId: string,
      secretAccessKey: string
    ): { success: true } | { error: string } => {
      const trimmedAccountId = accountId.trim();
      if (!trimmedAccountId) {
        return { error: 'Account ID is required.' };
      }

      // Editing an existing connection never gets the real secret values back to
      // re-display, so a blank secret field here means "keep what's already saved"
      // rather than "clear it" -- only Disconnect clears secrets.
      const existing = getCachedCredential();
      const resolvedApiToken = apiToken.trim() || existing?.apiToken || '';
      if (!resolvedApiToken) {
        return { error: 'API Token is required.' };
      }
      const resolvedAccessKeyId = accessKeyId.trim() || existing?.accessKeyId || '';
      const resolvedSecretAccessKey = secretAccessKey.trim() || existing?.secretAccessKey || '';

      // R2 keys are optional together -- either both are set (R2 browsing works)
      // or both are blank (Cloudflare is still connected, just without R2).
      if (resolvedAccessKeyId.length > 0 !== resolvedSecretAccessKey.length > 0) {
        return { error: 'Provide both R2 access keys, or leave both blank.' };
      }
      if (!safeStorage.isEncryptionAvailable()) {
        return { error: 'OS-level credential encryption is not available on this machine.' };
      }

      // Reconnecting the same account shouldn't wipe out an existing bucket selection.
      const selectedBuckets = existing?.selectedBuckets ?? [];

      const encrypted: EncryptedCredentialFile = {
        accountId: trimmedAccountId,
        apiToken: safeStorage.encryptString(resolvedApiToken).toString('base64'),
        accessKeyId: resolvedAccessKeyId
          ? safeStorage.encryptString(resolvedAccessKeyId).toString('base64')
          : undefined,
        secretAccessKey: resolvedSecretAccessKey
          ? safeStorage.encryptString(resolvedSecretAccessKey).toString('base64')
          : undefined,
        selectedBuckets
      };

      try {
        fs.mkdirSync(path.dirname(credentialFilePath()), { recursive: true });
        fs.writeFileSync(credentialFilePath(), JSON.stringify(encrypted), { mode: 0o600 });
        cachedCredential = {
          accountId: trimmedAccountId,
          apiToken: resolvedApiToken,
          accessKeyId: resolvedAccessKeyId || undefined,
          secretAccessKey: resolvedSecretAccessKey || undefined,
          selectedBuckets
        };
        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: message };
      }
    }
  );

  ipcMain.handle(
    'file-explorer:set-selected-r2-buckets',
    (_, bucketNames: string[]): { success: true } | { error: string } => {
      const credential = getCachedCredential();
      if (!credential) return { error: 'Cloudflare is not connected.' };
      return setSelectedBuckets(credential, bucketNames);
    }
  );

  ipcMain.handle('file-explorer:clear-r2-credential', (): void => {
    cachedCredential = null;
    try {
      fs.rmSync(credentialFilePath(), { force: true });
    } catch {
      // best-effort -- the in-memory cache is already cleared either way
    }
  });
}

function setSelectedBuckets(
  credential: R2Credential,
  bucketNames: string[]
): { success: true } | { error: string } {
  const encrypted: EncryptedCredentialFile = {
    accountId: credential.accountId,
    apiToken: safeStorage.encryptString(credential.apiToken).toString('base64'),
    accessKeyId: credential.accessKeyId
      ? safeStorage.encryptString(credential.accessKeyId).toString('base64')
      : undefined,
    secretAccessKey: credential.secretAccessKey
      ? safeStorage.encryptString(credential.secretAccessKey).toString('base64')
      : undefined,
    selectedBuckets: bucketNames
  };

  try {
    fs.mkdirSync(path.dirname(credentialFilePath()), { recursive: true });
    fs.writeFileSync(credentialFilePath(), JSON.stringify(encrypted), { mode: 0o600 });
    cachedCredential = { ...credential, selectedBuckets: bucketNames };
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
