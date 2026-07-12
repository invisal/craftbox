export interface StatefulSetData {
  id: string;
  name: string;
  ns: string;
  ready: string;
  replicas: number;
  age: string;
  rawAge: string;
  hasWarning: boolean;
}
