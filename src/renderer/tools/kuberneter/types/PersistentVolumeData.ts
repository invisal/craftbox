import { type K8sResource } from './K8sResource';

export interface PersistentVolumeProvider {
  type: string;
  driver?: string;
  fsType?: string;
  readOnly?: boolean;
  path?: string;
  volumeAttributes?: Record<string, string>;
}

export interface PersistentVolumeClaimRef {
  kind: string;
  name: string;
  namespace: string;
}

export interface PersistentVolumeData {
  id: string;
  name: string;
  status: string;
  capacity: string;
  storageClass: string;
  accessModes: string[];
  reclaimPolicy: string;
  volumeMode: string;
  age: string;
  createdTime: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  finalizers?: string[];
  provider?: PersistentVolumeProvider;
  claim?: PersistentVolumeClaimRef;
  rawItem?: K8sResource;
}
