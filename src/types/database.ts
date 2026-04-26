// Tipos do schema Supabase do KPH OS.
//
// Mantido manualmente — quando o schema crescer, considerar gerar via
// `supabase gen types typescript`. Por enquanto, single source of truth aqui.

export type RoleName =
  | "founder"
  | "cfo"
  | "gm"
  | "pessoas"
  | "chef"
  | "comprador"
  | "colaborador"
  | "socio_readonly";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      groups: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          group_id: string | null;
          name: string;
          slug: string;
          color: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id?: string | null;
          name: string;
          slug: string;
          color?: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string | null;
          name?: string;
          slug?: string;
          color?: string;
          active?: boolean;
          created_at?: string;
        };
      };
      units: {
        Row: {
          id: string;
          brand_id: string | null;
          name: string;
          address: string | null;
          whatsapp_number: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          name: string;
          address?: string | null;
          whatsapp_number?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string | null;
          name?: string;
          address?: string | null;
          whatsapp_number?: string | null;
          active?: boolean;
          created_at?: string;
        };
      };
      roles: {
        Row: {
          id: string;
          name: RoleName;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: RoleName;
          description?: string | null;
        };
        Update: {
          id?: string;
          name?: RoleName;
          description?: string | null;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          unit_id: string | null;
          brand_id: string | null;
          group_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role_id: string;
          unit_id?: string | null;
          brand_id?: string | null;
          group_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role_id?: string;
          unit_id?: string | null;
          brand_id?: string | null;
          group_id?: string | null;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource: string;
          resource_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource: string;
          resource_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource?: string;
          resource_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      kph_is_founder: { Args: Record<string, never>; Returns: boolean };
      kph_is_founder_or_cfo: { Args: Record<string, never>; Returns: boolean };
      kph_has_role_for_unit: { Args: { p_unit_id: string }; Returns: boolean };
      kph_has_role_for_brand: { Args: { p_brand_id: string }; Returns: boolean };
      kph_has_role_for_group: { Args: { p_group_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
};

// Helpers ergonômicos pra o app — pegar Row de uma tabela sem repetir caminho.
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Group = Tables<"groups">;
export type Brand = Tables<"brands">;
export type Unit = Tables<"units">;
export type RoleRow = Tables<"roles">;
export type UserRole = Tables<"user_roles">;
export type AuditLogEntry = Tables<"audit_log">;
