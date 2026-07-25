/**
 * APEX methodology interfaces for task tracking and state management.
 */

/** Per-framework documentation consultation record inside doc_consulted. */
export interface ApexDocConsultedEntry {
  consulted?: boolean;
  consulted_at?: string;
}

/**
 * APEX task entry in task.json.
 *
 * `doc_consulted` is ALWAYS a JSON object (`{}` when empty) -- a map of
 * framework name -> consultation record. It is never a boolean: readers
 * must not rely solely on `?? {}` (which only catches null/undefined and
 * lets a malformed `false` through unchanged) -- guard with an explicit
 * `typeof x === "object"` check, see inject-apex-context.native.ts.
 */
export interface ApexTask {
  subject: string;
  description: string;
  status: string;
  phase: string;
  started_at?: string;
  completed_at?: string;
  created_at?: string;
  doc_consulted: Record<string, ApexDocConsultedEntry>;
  files_modified: string[];
  blockedBy?: string[];
}

/** Structure of .harness/apex/task.json */
export interface ApexTaskFile {
  current_task: string;
  created_at: string;
  tasks: Record<string, ApexTask>;
}
