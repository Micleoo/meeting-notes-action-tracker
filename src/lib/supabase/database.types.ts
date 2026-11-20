type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type Table<Row, OptionalInsertKeys extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, OptionalInsertKeys> & Partial<Pick<Row, OptionalInsertKeys>>;
  Update: Partial<Row>;
  Relationships: [];
};

type WorkspaceRole = "owner" | "member";
type ActionItemStatus = "not_started" | "in_progress" | "completed";
type InvitationStatus = "pending" | "accepted" | "cancelled" | "expired";

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string;
        full_name: string;
        avatar_url: string | null;
        time_zone: string;
        created_at: string;
        updated_at: string;
      }, "full_name" | "avatar_url" | "time_zone" | "created_at" | "updated_at">;
      workspaces: Table<{
        id: string;
        name: string;
        created_at: string;
        updated_at: string;
      }, "id" | "created_at" | "updated_at">;
      workspace_members: Table<{
        id: string;
        workspace_id: string;
        profile_id: string;
        role: WorkspaceRole;
        email_reminders_enabled: boolean;
        joined_at: string;
        left_at: string | null;
        created_at: string;
        updated_at: string;
      }, "id" | "role" | "email_reminders_enabled" | "joined_at" | "left_at" | "created_at" | "updated_at"> & {
        Relationships: [
          Relationship & {
            foreignKeyName: "workspace_members_workspace_id_fkey";
            referencedRelation: "workspaces";
            columns: ["workspace_id"];
            referencedColumns: ["id"];
            isOneToOne: false;
          },
          Relationship & {
            foreignKeyName: "workspace_members_profile_id_fkey";
            referencedRelation: "profiles";
            columns: ["profile_id"];
            referencedColumns: ["id"];
            isOneToOne: false;
          },
        ];
      };
      workspace_invitations: Table<{
        id: string;
        workspace_id: string;
        invited_by_member_id: string;
        invitee_email: string;
        token: string;
        status: InvitationStatus;
        expires_at: string;
        accepted_at: string | null;
        created_at: string;
        updated_at: string;
      }, "id" | "token" | "status" | "expires_at" | "accepted_at" | "created_at" | "updated_at">;
      meetings: Table<{
        id: string;
        workspace_id: string;
        created_by_member_id: string;
        title: string;
        notes: string;
        scheduled_at: string;
        archived_at: string | null;
        created_at: string;
        updated_at: string;
      }, "id" | "notes" | "archived_at" | "created_at" | "updated_at"> & {
        Relationships: [
          Relationship & {
            foreignKeyName: "meetings_workspace_id_fkey";
            referencedRelation: "workspaces";
            columns: ["workspace_id"];
            isOneToOne: false;
            referencedColumns: ["id"];
          },
        ];
      };
      meeting_participants: Table<{
        meeting_id: string;
        member_id: string;
        created_at: string;
      }, "created_at"> & {
        Relationships: [
          Relationship & {
            foreignKeyName: "meeting_participants_meeting_id_fkey";
            referencedRelation: "meetings";
            columns: ["meeting_id"];
            isOneToOne: false;
            referencedColumns: ["id"];
          },
          Relationship & {
            foreignKeyName: "meeting_participants_member_id_fkey";
            referencedRelation: "workspace_members";
            columns: ["member_id"];
            isOneToOne: false;
            referencedColumns: ["id"];
          },
        ];
      };
      action_items: Table<{
        id: string;
        meeting_id: string;
        created_by_member_id: string;
        owner_member_id: string;
        title: string;
        description: string;
        status: ActionItemStatus;
        due_at: string | null;
        completed_at: string | null;
        archived_at: string | null;
        created_at: string;
        updated_at: string;
      }, "id" | "created_by_member_id" | "description" | "status" | "due_at" | "completed_at" | "archived_at" | "created_at" | "updated_at">;
      reminders: Table<{
        id: string;
        action_item_id: string;
        scheduled_for: string;
        cancelled_at: string | null;
        created_at: string;
        updated_at: string;
      }, "id" | "cancelled_at" | "created_at" | "updated_at">;
      notifications: Table<{
        id: string;
        recipient_member_id: string;
        reminder_id: string | null;
        channel: "in_app";
        title: string;
        body: string;
        sent_at: string | null;
        read_at: string | null;
        created_at: string;
      }, "id" | "reminder_id" | "channel" | "body" | "sent_at" | "read_at" | "created_at">;
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
          reassignments?: Record<string, string>;
        };
        Returns: undefined;
      };
      set_workspace_member_role: {
        Args: {
          target_workspace: string;
          target_member: string;
          new_role: WorkspaceRole;
        };
        Returns: undefined;
      };
      update_email_reminders: {
        Args: { target_member: string; enabled: boolean };
        Returns: undefined;
      };
      save_meeting_with_participants: {
        Args: {
          target_meeting: string | null;
          target_workspace: string;
          meeting_title: string;
          meeting_notes: string;
          meeting_scheduled_at: string;
          participant_member_ids: string[];
        };
        Returns: string;
      };
      save_action_item_with_reminders: {
        Args: {
          target_action_item: string | null;
          target_meeting: string;
          target_owner_member: string;
          item_title: string;
          item_description: string;
          item_status: ActionItemStatus;
          item_due_at: string | null;
          item_completed_at: string | null;
          reminder_schedule: string[];
        };
        Returns: string;
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      action_item_status: ActionItemStatus;
      invitation_status: InvitationStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
