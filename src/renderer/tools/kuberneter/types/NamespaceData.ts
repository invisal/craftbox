import { type K8sResource } from './K8sResource';

export interface NamespaceData {
  id: string;
  name: string;
  status: string;
  age: string;
  createdTime: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  rawItem?: K8sResource;
}
