type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type Row = Record<string, any>;
type Table = {
  Row: Row;
  Insert: Row;
  Update: Row;
  Relationships: Relationship[];
};

// The full generated schema is produced by `supabase gen types` once the
// development migration is applied. This interim schema avoids Supabase's
// recursive `Database = any` client type during development.
export type Database = {
  public: {
    Tables: {
      profiles: Table;
      workspaces: Table;
      workspace_members: Table & {
        Relationships: [
          Relationship & {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            referencedRelation: "workspaces";
          },
          Relationship & {
            foreignKeyName: "workspace_members_profile_id_fkey";
            referencedRelation: "profiles";
          },
        ];
      };
      workspace_invitations: Table;
      meetings: Table & {
        Relationships: [
          Relationship & {
            foreignKeyName: "meetings_workspace_id_fkey";
            referencedRelation: "workspaces";
          },
        ];
      };
      meeting_participants: Table & {
        Relationships: [
          Relationship & {
            foreignKeyName: "meeting_participants_meeting_id_fkey";
            referencedRelation: "meetings";
          },
          Relationship & {
            foreignKeyName: "meeting_participants_member_id_fkey";
            referencedRelation: "workspace_members";
          },
        ];
      };
      action_items: Table;
      reminders: Table;
      notifications: Table;
    };
    Views: Record<string, never>;
    Functions: {
      create_workspace: { Args: { workspace_name: string }; Returns: string };
      accept_workspace_invitation: {
        Args: { invitation_token: string };
        Returns: string;
      };
      remove_workspace_member: {
        Args: {
          target_workspace: string;
          target_member: string;
          reassignments?: Row;
        };
        Returns: undefined;
      };
      set_workspace_member_role: {
        Args: {
          target_workspace: string;
          target_member: string;
          new_role: "owner" | "member";
        };
        Returns: undefined;
      };
      update_email_reminders: {
        Args: { target_member: string; enabled: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      workspace_role: "owner" | "member";
      action_item_status: "not_started" | "in_progress" | "completed";
      invitation_status: "pending" | "accepted" | "cancelled" | "expired";
    };
    CompositeTypes: Record<string, never>;
  };
};
