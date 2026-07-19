import { type K8sResource } from './K8sResource';

export interface PersistentVolumeClaimData {
  id: string;
  name: string;
  ns: string;
  status: string;
  volume: string;
  capacity: string;
  storageClass: string;
  accessModes: string[];
  age: string;
  createdTime: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  finalizers?: string[];
  selector?: {
    matchLabels?: Record<string, string>;
    matchExpressions?: Array<{ key: string; operator: string; values?: string[] }>;
  };
  pods: string[];
  rawItem?: K8sResource;
}
