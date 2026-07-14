export interface ConfigMapData {
  id: string;
  name: string;
  ns: string;
  keysCount: number;
  keysList: string[];
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  age: string;
}
