export interface JobData {
  id: string;
  name: string;
  ns: string;
  completions: string; // e.g. "1/1"
  succeeded: number;
  desired: number;
  age: string;
  rawAge: string;
  conditions: string; // e.g. "SuccessCriteriaMet", "Failed", "Running"
  hasWarning: boolean;
}
