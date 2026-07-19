export interface AvailableCluster {
  name: string;
  configPath: string;
}

/**
 * Loads unique Kubernetes contexts across all configured Kubeconfig paths.
 */
export async function loadAllClusters(kubeconfigs: string[]): Promise<AvailableCluster[]> {
  const allPaths = ['default', ...kubeconfigs];
  const results: AvailableCluster[] = [];

  for (const path of allPaths) {
    try {
      const pathArg = path === 'default' ? undefined : path;
      const contexts = await window.kuberneter.listContexts(pathArg);
      if (contexts && Array.isArray(contexts)) {
        for (const ctx of contexts) {
          if (ctx && ctx.name) {
            if (!results.some((r) => r.name === ctx.name)) {
              results.push({
                name: ctx.name,
                configPath: path
              });
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error loading contexts for ${path}:`, err);
    }
  }

  return results;
}
