import { type K8sResource } from './K8sResource';

export interface EventData {
  id: string;
  name?: string;
  type: 'Normal' | 'Warning' | string;
  source: string;
  ns: string;
  involvedObject: string;
  involvedKind: string;
  message: string;
  count: number;
  age: string;
  lastSeen: string;
  rawLastSeen: number;
  reason?: string;
  firstSeen?: string;
  involvedNamespace?: string;
  involvedFieldPath?: string;
  rawItem?: K8sResource;
}
