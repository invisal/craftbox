import { type K8sResource } from './K8sResource';

export interface ServiceAccountData {
  id: string; // namespace/name
  name: string;
  ns: string;
  secretsCount: number;
  secrets: string[];
  imagePullSecrets: string[];
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  age: string;
  createdTime: string;
  rawItem?: K8sResource;
}
