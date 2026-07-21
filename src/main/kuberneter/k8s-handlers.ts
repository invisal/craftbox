import { ipcMain, app, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as net from 'net';
import { spawn } from 'child_process';
import type { ChildProcess } from 'child_process';
import { runKubectl, listKubeconfigContexts } from './k8s-cli';

/** Find a free TCP port on localhost */
function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = addr && typeof addr === 'object' ? addr.port : 0;
      srv.close((err) => {
        if (err) reject(err);
        else resolve(port);
      });
    });
    srv.on('error', reject);
  });
}

/** Wait for kubectl port-forward to print "Forwarding from" — signals it is ready */
function waitForPortForward(child: ChildProcess, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('port-forward timed out waiting for ready signal'));
    }, timeoutMs);

    const onData = (chunk: Buffer) => {
      if (chunk.toString().includes('Forwarding from')) {
        clearTimeout(timer);
        child.stdout?.off('data', onData);
        resolve();
      }
    };

    child.stdout?.on('data', onData);

    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`port-forward exited early with code ${code}`));
    });
  });
}

/**
 * Query the Prometheus HTTP API with a PromQL instant query.
 * Returns the raw result array from data.result.
 */
async function queryPromQL(
  localPort: number,
  promql: string
): Promise<{ metric: Record<string, string>; value: [number, string] }[]> {
  const encoded = encodeURIComponent(promql);
  const url = `http://127.0.0.1:${localPort}/api/v1/query?query=${encoded}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`Prometheus HTTP ${res.status}: ${res.statusText}`);
  }
  const json = (await res.json()) as {
    status: string;
    data: {
      resultType: string;
      result: { metric: Record<string, string>; value: [number, string] }[];
    };
  };
  if (json.status !== 'success') {
    throw new Error(`Prometheus returned status: ${json.status}`);
  }
  return json.data.result;
}

export function registerK8sHandlers(): void {
  // 1. List contexts of a given kubeconfig path (or default)
  ipcMain.handle('kuberneter:list-contexts', async (_, kubeconfigPath?: string) => {
    try {
      const resolvedPath = kubeconfigPath || undefined;
      return await listKubeconfigContexts(resolvedPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  });

  // 2. Select and load local kubeconfig file via OS file dialog
  ipcMain.handle('kuberneter:select-kubeconfig-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Kubeconfig', extensions: ['*', 'yaml', 'yml', 'conf'] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  // 3. Save pasted configuration content to appData/kubeconfigs directory
  ipcMain.handle('kuberneter:save-kubeconfig', async (_, content: string, filename: string) => {
    try {
      const userDataDir = app.getPath('userData');
      const kubeconfigsDir = path.join(userDataDir, 'kubeconfigs');

      if (!fs.existsSync(kubeconfigsDir)) {
        fs.mkdirSync(kubeconfigsDir, { recursive: true });
      }

      // Clean filename (remove special chars/spaces)
      const safeName = filename.replace(/[^a-zA-Z0-9-_]/g, '') || `config-${Date.now()}`;
      const filePath = path.join(kubeconfigsDir, `${safeName}.yaml`);

      fs.writeFileSync(filePath, content, 'utf8');
      return filePath;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { error: message };
    }
  });

  // 4. Query live cluster resources (Pods, Deployments, Services, ConfigMaps, etc.)
  ipcMain.handle(
    'kuberneter:get-resources',
    async (
      _,
      kubeconfigPath: string | undefined,
      contextName: string | undefined,
      resource: string,
      namespace?: string
    ) => {
      try {
        const resolvedKubeconfig = kubeconfigPath || undefined;

        // Build CLI args
        const args = [];
        if (contextName) {
          args.push('--context', contextName);
        }

        args.push('get', resource);

        // Namespace scoping (only apply if the resource is namespaced)
        const isClusterScoped = [
          'nodes',
          'namespaces',
          'clusterroles',
          'clusterrolebindings',
          'storageclasses',
          'persistentvolumes',
          'pvs'
        ].includes(resource.toLowerCase());

        if (!isClusterScoped) {
          if (namespace && namespace !== 'All Namespaces') {
            args.push('-n', namespace);
          } else {
            args.push('-A');
          }
        }

        args.push('-o', 'json');

        const stdout = await runKubectl(args, resolvedKubeconfig);
        const firstBrace = stdout.indexOf('{');
        const lastBrace = stdout.lastIndexOf('}');
        let jsonStr = stdout;
        if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
          jsonStr = stdout.substring(firstBrace, lastBrace + 1);
        }
        const data = JSON.parse(jsonStr);

        return { items: data.items || [] };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: message };
      }
    }
  );

  // 5. Query live node metrics (CPU & Memory usage)
  ipcMain.handle(
    'kuberneter:get-top-nodes',
    async (_, kubeconfigPath: string | undefined, contextName: string | undefined) => {
      try {
        const resolvedKubeconfig = kubeconfigPath || undefined;
        const args = [];
        if (contextName) {
          args.push('--context', contextName);
        }
        args.push('top', 'nodes', '--no-headers');

        let stdout: string;
        try {
          stdout = await runKubectl(args, resolvedKubeconfig);
        } catch {
          // Metrics API not available - return empty items so UI shows N/A
          return { items: [] };
        }

        const lines = stdout.trim().split('\n');
        const items = lines
          .map((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 5) {
              return {
                name: parts[0],
                cpu: parts[1],
                cpuPct: parts[2],
                memory: parts[3],
                memoryPct: parts[4]
              };
            }
            return null;
          })
          .filter(Boolean);

        return { items };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: message };
      }
    }
  );

  // 6. Query live pod metrics (CPU & Memory usage)
  ipcMain.handle(
    'kuberneter:get-top-pods',
    async (
      _,
      kubeconfigPath: string | undefined,
      contextName: string | undefined,
      namespace?: string
    ) => {
      try {
        const resolvedKubeconfig = kubeconfigPath || undefined;
        const args = [];
        if (contextName) {
          args.push('--context', contextName);
        }
        args.push('top', 'pods');
        if (namespace && namespace !== 'All Namespaces') {
          args.push('-n', namespace);
        } else {
          args.push('-A');
        }
        args.push('--no-headers');

        let stdout: string;
        try {
          stdout = await runKubectl(args, resolvedKubeconfig);
        } catch {
          // Metrics API not available - return empty items so UI shows N/A
          return { items: [] };
        }

        const lines = stdout.trim().split('\n');
        const items = lines
          .map((line) => {
            const trimmed = line.trim();
            if (!trimmed) return null;
            const parts = trimmed.split(/\s+/);
            const isAllNamespaces = !namespace || namespace === 'All Namespaces';
            if (isAllNamespaces && parts.length >= 4) {
              return {
                namespace: parts[0],
                name: parts[1],
                cpu: parts[2],
                memory: parts[3]
              };
            } else if (!isAllNamespaces && parts.length >= 3) {
              return {
                namespace: namespace,
                name: parts[0],
                cpu: parts[1],
                memory: parts[2]
              };
            }
            return null;
          })
          .filter(Boolean);

        return { items };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: message };
      }
    }
  );

  // 7. Query real pod CPU & Memory metrics from Prometheus via kubectl port-forward
  ipcMain.handle(
    'kuberneter:query-prometheus',
    async (
      _,
      kubeconfigPath: string | undefined,
      contextName: string | undefined,
      prometheusNamespace = 'monitoring',
      prometheusService = 'prometheus-stack-kube-prom-prometheus',
      prometheusPort = 9090
    ) => {
      let portForwardProc: ChildProcess | null = null;
      try {
        const resolvedKubeconfig = kubeconfigPath || undefined;
        const localPort = await getFreePort();

        // Build kubectl port-forward args
        const pfArgs: string[] = [];
        if (resolvedKubeconfig) {
          pfArgs.push('--kubeconfig', resolvedKubeconfig);
        }
        if (contextName) {
          pfArgs.push('--context', contextName);
        }
        pfArgs.push(
          'port-forward',
          `svc/${prometheusService}`,
          `${localPort}:${prometheusPort}`,
          '-n',
          prometheusNamespace
        );

        portForwardProc = spawn('kubectl', pfArgs, { shell: true });

        // Wait until port-forward signals it's ready
        await waitForPortForward(portForwardProc);

        // Query CPU: sum of rate of CPU usage per pod/namespace (5-minute window)
        const cpuQuery =
          'sum(rate(container_cpu_usage_seconds_total{container!="",container!="POD"}[5m])) by (pod, namespace)';
        // Query Memory: working set bytes per pod/namespace (matches what Lens shows)
        const memQuery =
          'sum(container_memory_working_set_bytes{container!="",container!="POD"}) by (pod, namespace)';

        const [cpuResults, memResults] = await Promise.all([
          queryPromQL(localPort, cpuQuery),
          queryPromQL(localPort, memQuery)
        ]);

        // Build lookup maps keyed by "namespace/pod"
        const cpuMap = new Map<string, string>();
        for (const r of cpuResults) {
          const key = `${r.metric.namespace}/${r.metric.pod}`;
          const cores = parseFloat(r.value[1]);
          cpuMap.set(key, isNaN(cores) ? '0' : cores.toFixed(4));
        }

        const memMap = new Map<string, string>();
        for (const r of memResults) {
          const key = `${r.metric.namespace}/${r.metric.pod}`;
          const bytes = parseFloat(r.value[1]);
          // Convert bytes to Mi for consistent parsing downstream
          if (!isNaN(bytes)) {
            const mib = bytes / (1024 * 1024);
            memMap.set(key, `${mib.toFixed(3)}Mi`);
          }
        }

        // Merge into unified items array (union of all pods that have any metric)
        const keys = new Set([...cpuMap.keys(), ...memMap.keys()]);
        const items = Array.from(keys).map((key) => {
          const [ns, ...nameParts] = key.split('/');
          return {
            namespace: ns,
            name: nameParts.join('/'),
            cpu: cpuMap.get(key) ?? '0',
            memory: memMap.get(key) ?? '0Mi'
          };
        });

        return { items };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: message, items: [] };
      } finally {
        // Always clean up the port-forward process
        if (portForwardProc && !portForwardProc.killed) {
          portForwardProc.kill('SIGTERM');
        }
      }
    }
  );
}
