import { type K8sResource } from './K8sResource';

export interface ClusterRoleRule {
  apiGroups?: string[];
  resources?: string[];
  resourceNames?: string[];
  verbs: string[];
  nonResourceURLs?: string[];
}

export interface ClusterRoleData {
  id: string;
  name: string;
  age: string;
  createdTime: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  rules?: ClusterRoleRule[];
  rawItem?: K8sResource;
}
