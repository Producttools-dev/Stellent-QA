/**
 * Hand-written types for the Stellent QA Supabase schema.
 *
 * Mirrors db/001_schema.sql. Regenerate with the Supabase CLI
 * (`supabase gen types typescript`) once the project is linked if you prefer.
 */

export type AuditStatus = "pending" | "running" | "complete" | "failed";
export type TriggeredBy = "manual" | "scheduled" | "free_public";
export type FindingStatus = "pass" | "fail" | "warning";

/** 0 = critical … 4 = minor (matches CMA's severity-int convention). */
export type Severity = 0 | 1 | 2 | 3 | 4;

export interface Site {
  id: string;
  user_id: string;
  name: string;
  url: string;
  is_active: boolean;
  created_at: string;
}

export interface AuditRun {
  id: string;
  site_id: string;
  status: AuditStatus;
  triggered_by: TriggeredBy;
  verdict: string | null;
  score: number | null;
  pdf_url: string | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Finding {
  id: string;
  run_id: string;
  test_id: string | null;
  module: string | null;
  title: string | null;
  severity: number | null;
  status: FindingStatus | null;
  detail: string | null;
  how_to_fix: string | null;
  created_at: string;
}

export interface FreeAuditRequest {
  id: string;
  url: string;
  email: string | null;
  status: AuditStatus;
  result: unknown | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      sites: {
        Row: Site;
        Insert: Omit<Site, "id" | "created_at" | "is_active"> &
          Partial<Pick<Site, "id" | "created_at" | "is_active">>;
        Update: Partial<Site>;
        Relationships: [];
      };
      audit_runs: {
        Row: AuditRun;
        Insert: Omit<AuditRun, "id" | "created_at"> &
          Partial<Pick<AuditRun, "id" | "created_at">>;
        Update: Partial<AuditRun>;
        Relationships: [];
      };
      findings: {
        Row: Finding;
        Insert: Omit<Finding, "id" | "created_at"> &
          Partial<Pick<Finding, "id" | "created_at">>;
        Update: Partial<Finding>;
        Relationships: [];
      };
      free_audit_requests: {
        Row: FreeAuditRequest;
        Insert: Omit<FreeAuditRequest, "id" | "created_at" | "status"> &
          Partial<Pick<FreeAuditRequest, "id" | "created_at" | "status">>;
        Update: Partial<FreeAuditRequest>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
