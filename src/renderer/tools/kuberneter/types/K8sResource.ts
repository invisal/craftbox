export interface K8sResource {
  kind?: string;
  metadata?: {
    name?: string;
    namespace?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  status?: {
    phase?: string;
    containerStatuses?: { restartCount?: number }[];
    replicas?: number;
    readyReplicas?: number;
    updatedReplicas?: number;
    availableReplicas?: number;
    desiredNumberScheduled?: number;
    numberReady?: number;
    conditions?: { type?: string; status?: string; message?: string }[];
    nodeInfo?: { kubeletVersion?: string };
    capacity?: { cpu?: string; memory?: string };
    allocatable?: { cpu?: string; memory?: string };
  };
  spec?: {
    type?: string;
    clusterIP?: string;
    ports?: { port?: number; protocol?: string }[];
    taints?: { key?: string; effect?: string }[];
  };
  data?: Record<string, unknown>;
}
