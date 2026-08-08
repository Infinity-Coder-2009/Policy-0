/**
 * Supabase Client
 * ============================================================
 * Database client for Policy-0.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types export
export type Database = {
  public: {
    Tables: {
      users: {
        Row: { id: string; email: string; role: string; name: string | null; created_at: string };
        Insert: { id?: string; email: string; role?: string; name?: string | null; created_at?: string };
        Update: { id?: string; email?: string; role?: string; name?: string | null; created_at?: string };
      };
      policies: {
        Row: { id: string; title: string; description: string | null; user_id: string; mode: string; policy_data: any; created_at: string };
        Insert: { id?: string; title: string; description?: string | null; user_id: string; mode?: string; policy_data?: any; created_at?: string };
        Update: { id?: string; title?: string; description?: string | null; user_id?: string; mode?: string; policy_data?: any; created_at?: string };
      };
      policy_versions: {
        Row: { id: string; policy_id: string; version: number; policy_data: any; verified: boolean; created_at: string };
        Insert: { id?: string; policy_id: string; version: number; policy_data: any; verified?: boolean; created_at?: string };
        Update: { id?: string; policy_id?: string; version?: number; policy_data?: any; verified?: boolean; created_at?: string };
      };
      deployment_runs: {
        Row: { id: string; policy_id: string; source: string; status: string; success: boolean | null; metrics: any | null; created_at: string };
        Insert: { id?: string; policy_id: string; source?: string; status?: string; success?: boolean | null; metrics?: any | null; created_at?: string };
        Update: { id?: string; policy_id?: string; source?: string; status?: string; success?: boolean | null; metrics?: any | null; created_at?: string };
      };
    };
  };
};