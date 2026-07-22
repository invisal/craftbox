import { useEffect, useState, type ReactNode } from 'react';
import { cn } from 'cnfast';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type Status = 'loading' | 'configured' | 'empty';
type GatewayStatus = 'loading' | 'configured' | 'empty';

interface ConnectCloudflareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-text-dim">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={cn(
        'text-xs px-2 py-0.5 rounded-full',
        connected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface-3 text-text-dim'
      )}
    >
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

export function ConnectCloudflareDialog({ open, onOpenChange }: ConnectCloudflareDialogProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [isEditing, setIsEditing] = useState(false);
  const [hasAccessKeys, setHasAccessKeys] = useState(false);
  const [accountId, setAccountId] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus>('loading');
  const [gatewayId, setGatewayId] = useState('');
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [gatewaySaving, setGatewaySaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    window.fileExplorer.getR2CredentialStatus().then((res) => {
      setStatus(res.configured ? 'configured' : 'empty');
      setHasAccessKeys(res.hasAccessKeys);
      setAccountId(res.configured ? res.accountId : '');
    });
    window.fileExplorer.getAiGatewayCredentialStatus().then((res) => {
      setGatewayStatus(res.configured ? 'configured' : 'empty');
      setGatewayId(res.gatewayId);
    });
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await window.fileExplorer.setR2Credential(
      accountId.trim(),
      apiToken.trim(),
      accessKeyId.trim(),
      secretAccessKey.trim()
    );
    setSaving(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setStatus('configured');
    setIsEditing(false);
    setHasAccessKeys(Boolean(accessKeyId.trim() || secretAccessKey.trim()) || hasAccessKeys);
    setApiToken('');
    setAccessKeyId('');
    setSecretAccessKey('');
  };

  const handleClear = async () => {
    setSaving(true);
    await window.fileExplorer.clearR2Credential();
    setSaving(false);
    setStatus('empty');
    setIsEditing(false);
    setHasAccessKeys(false);
    setAccountId('');
  };

  const handleEdit = () => {
    setError(null);
    setApiToken('');
    setAccessKeyId('');
    setSecretAccessKey('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setError(null);
    setIsEditing(false);
  };

  const handleGatewaySave = async () => {
    setGatewaySaving(true);
    setGatewayError(null);
    const result = await window.fileExplorer.setAiGatewayCredential(gatewayId.trim(), '');
    setGatewaySaving(false);
    if ('error' in result) {
      setGatewayError(result.error);
      return;
    }
    setGatewayStatus('configured');
  };

  const handleGatewayClear = async () => {
    setGatewaySaving(true);
    await window.fileExplorer.clearAiGatewayCredential();
    setGatewaySaving(false);
    setGatewayStatus('empty');
    setGatewayId('');
  };

  const showCloudflareForm = status === 'empty' || isEditing;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setIsEditing(false);
    onOpenChange(nextOpen);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content className="max-w-sm">
        <div className="flex items-center justify-between">
          <Dialog.Title>Connect Cloudflare</Dialog.Title>
          {status !== 'loading' && (
            <div className="mr-6">
              <StatusBadge connected={status === 'configured'} />
            </div>
          )}
        </div>
        <Dialog.Description>
          Account ID and API Token connect your Cloudflare account. R2 access keys are optional --
          add them later to browse R2 buckets from the file explorer.
        </Dialog.Description>

        <div className="mt-4">
          {status === 'configured' && !isEditing ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleEdit}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => void handleClear()}
                disabled={saving}
              >
                {saving ? 'Clearing…' : 'Disconnect'}
              </Button>
            </div>
          ) : showCloudflareForm ? (
            <div className="flex flex-col gap-3">
              <Field label="Cloudflare Account ID">
                <Input size="sm" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
              </Field>
              <Field label="API Token">
                <Input
                  size="sm"
                  type="password"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder={isEditing ? 'Leave blank to keep saved token' : undefined}
                />
              </Field>
              <Field label="R2 Access Key ID (optional)">
                <Input
                  size="sm"
                  value={accessKeyId}
                  onChange={(e) => setAccessKeyId(e.target.value)}
                  placeholder={
                    isEditing && hasAccessKeys ? 'Leave blank to keep saved key' : undefined
                  }
                />
              </Field>
              <Field label="R2 Secret Access Key (optional)">
                <Input
                  size="sm"
                  type="password"
                  value={secretAccessKey}
                  onChange={(e) => setSecretAccessKey(e.target.value)}
                  placeholder={
                    isEditing && hasAccessKeys ? 'Leave blank to keep saved key' : undefined
                  }
                />
              </Field>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
                {isEditing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {status === 'configured' && (
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-text-base">AI Gateway</span>
              {gatewayStatus !== 'loading' && (
                <StatusBadge connected={gatewayStatus === 'configured'} />
              )}
            </div>
            <p className="mt-1 text-xs text-text-dim">
              Lets the file explorer&apos;s AI agent chat through your Cloudflare AI Gateway.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              <Field label="Gateway ID">
                <Input size="sm" value={gatewayId} onChange={(e) => setGatewayId(e.target.value)} />
              </Field>
              {gatewayError && <p className="text-xs text-red-400">{gatewayError}</p>}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => void handleGatewaySave()}
                  disabled={gatewaySaving}
                >
                  {gatewaySaving ? 'Saving…' : 'Save'}
                </Button>
                {gatewayStatus === 'configured' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => void handleGatewayClear()}
                    disabled={gatewaySaving}
                  >
                    {gatewaySaving ? 'Clearing…' : 'Disconnect'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
