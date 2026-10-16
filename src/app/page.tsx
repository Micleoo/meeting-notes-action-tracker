"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Archive,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Mail,
  Plus,
  Search,
  Settings2,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, Brand, Empty, Field, Modal } from "@/components/ui";
import { ActionForm, MeetingForm } from "@/components/forms";
import {
  formatDate,
  overdue,
  upcoming,
  statuses,
  type ActionItem,
  type Meeting,
  type Notification,
  type Status,
} from "@/lib/domain";

type View =
  | "login"
  | "workspace"
  | "dashboard"
  | "meetings"
  | "detail"
  | "actions"
  | "notifications"
  | "settings";
type Member = {
  id: string;
  profileId: string;
  name: string;
  email: string;
  role: "owner" | "member";
  reminders: boolean;
};
type Workspace = {
  id: string;
  name: string;
  role: Member["role"];
  memberId: string;
};
type Data = {
  meetings: Meeting[];
  actions: ActionItem[];
  notifications: Notification[];
};
type Invitation = {
  id: string;
  invitee_email: string;
  status: string;
  created_at: string;
};
type Editor =
  | { kind: "meeting"; initial?: Meeting }
  | { kind: "action"; initial?: ActionItem; meetingId?: string }
  | null;
const nav = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "meetings", label: "Meeting", icon: CalendarDays },
  { view: "actions", label: "Action item", icon: ListTodo },
  { view: "notifications", label: "Notifikasi", icon: Bell },
] as const;
const emptyData: Data = { meetings: [], actions: [], notifications: [] };
const statusToDb: Record<Status, string> = {
  "Belum Mulai": "not_started",
  Dikerjakan: "in_progress",
  Selesai: "completed",
};
const statusFromDb: Record<string, Status> = {
  not_started: "Belum Mulai",
  in_progress: "Dikerjakan",
  completed: "Selesai",
};

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
  } | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [data, setData] = useState<Data>(emptyData);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [view, setView] = useState<View>("login");
  const [selectedId, setSelectedId] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const [pending, setPending] = useState<ActionItem | null>(null);
  const [keepReminders, setKeepReminders] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [reassign, setReassign] = useState<Record<string, string>>({});
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [meetingFilter, setMeetingFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [nameMap, setNameMap] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const selected = data.meetings.find((meeting) => meeting.id === selectedId);
  const unread = data.notifications.filter((item) => !item.read).length;
  const currentMember = members.find(
    (member) => member.id === workspace?.memberId,
  );
  const isOwner = currentMember?.role === "owner";
  const liveActions = data.actions.filter((item) => !item.archived);
  const activeActions = liveActions.filter((item) => item.status !== "Selesai");
  const completed = liveActions.length - activeActions.length;
  const late = activeActions.filter((item) => overdue(item, now));
  const soon = activeActions
    .filter((item) => upcoming(item, now))
    .sort((a, b) => a.due.localeCompare(b.due));

  const loadWorkspaces = useCallback(
    async (profileId: string) => {
      const { data: rows, error: loadError } = await supabase
        .from("workspace_members")
        .select("id,workspace_id,role,workspaces(id,name)")
        .eq("profile_id", profileId)
        .is("left_at", null);
      if (loadError) throw loadError;
      const mapped = (rows ?? []).map((row: any) => ({
        id: row.workspaces.id as string,
        name: row.workspaces.name as string,
        role: row.role as Member["role"],
        memberId: row.id as string,
      }));
      setWorkspaces(mapped);
      if (mapped.length === 1) {
        setWorkspace(mapped[0]);
        setView("dashboard");
      } else if (mapped.length > 1) setView("workspace");
      else setView("workspace");
    },
    [supabase],
  );

  const loadWorkspace = useCallback(
    async (active: Workspace) => {
      setBusy(true);
      setError("");
      try {
        const results: any[] = await Promise.all<any>([
          supabase
            .from("workspace_members")
            .select(
              "id,profile_id,role,email_reminders_enabled,profiles(full_name)",
            )
            .eq("workspace_id", active.id)
            .is("left_at", null),
          supabase
            .from("meetings")
            .select(
              "id,title,notes,scheduled_at,archived_at,meeting_participants(member_id)",
            )
            .eq("workspace_id", active.id)
            .order("scheduled_at", { ascending: false }),
          supabase
            .from("action_items")
            .select(
              "id,meeting_id,title,description,status,due_at,owner_member_id,archived_at",
            )
            .in(
              "meeting_id",
              (
                await supabase
                  .from("meetings")
                  .select("id")
                  .eq("workspace_id", active.id)
              ).data?.map((m: any) => m.id) ?? [],
            ),
          supabase
            .from("reminders")
            .select("id,action_item_id,scheduled_for,cancelled_at"),
          supabase
            .from("notifications")
            .select(
              "id,title,created_at,read_at,reminder_id,reminders(action_item_id)",
            )
            .eq("recipient_member_id", active.memberId)
            .order("created_at", { ascending: false }),
          active.role === "owner"
            ? supabase
                .from("workspace_invitations")
                .select("id,invitee_email,status,created_at")
                .eq("workspace_id", active.id)
                .order("created_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ]);
        const [
          memberRes,
          meetingRes,
          actionRes,
          reminderRes,
          notificationRes,
          inviteRes,
        ] = results;
        const failure = [
          memberRes,
          meetingRes,
          actionRes,
          reminderRes,
          notificationRes,
          inviteRes,
        ].find((r: any) => r.error);
        if (failure?.error) throw failure.error;
        const memberRows = memberRes.data ?? [];
        const mappedMembers: Member[] = memberRows.map((m: any) => ({
          id: m.id,
          profileId: m.profile_id,
          name: m.profiles?.full_name || "Member",
          email: "",
          role: m.role,
          reminders: m.email_reminders_enabled,
        }));
        const names = Object.fromEntries(
          mappedMembers.map((m) => [m.id, m.name]),
        );
        setMembers(mappedMembers);
        setNameMap(names);
        const meetings: Meeting[] = (meetingRes.data ?? []).map((m: any) => ({
          id: m.id,
          title: m.title,
          notes: m.notes ?? "",
          time: m.scheduled_at,
          participants: (m.meeting_participants ?? []).map(
            (p: any) => p.member_id,
          ),
          archived: !!m.archived_at,
        }));
        const reminderRows = reminderRes.data ?? [];
        const actions: ActionItem[] = (actionRes.data ?? []).map((a: any) => ({
          id: a.id,
          meetingId: a.meeting_id,
          title: a.title,
          description: a.description ?? "",
          owner: a.owner_member_id,
          due: a.due_at ?? "",
          status: statusFromDb[a.status] ?? "Belum Mulai",
          reminders: reminderRows
            .filter((r: any) => r.action_item_id === a.id && !r.cancelled_at)
            .map((r: any) => r.scheduled_for)
            .sort(),
          archived: !!a.archived_at,
        }));
        const notifications: Notification[] = (notificationRes.data ?? []).map(
          (n: any) => ({
            id: n.id,
            actionId: n.reminders?.action_item_id ?? "",
            title: n.title,
            time: n.created_at,
            read: !!n.read_at,
          }),
        );
        setData({ meetings, actions, notifications });
        setInvitations(inviteRes.data ?? []);
        if (!selectedId && meetings[0]) setSelectedId(meetings[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat Workspace.");
      } finally {
        setBusy(false);
      }
    },
    [supabase, selectedId],
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const current = session?.user;
        if (!current) {
          setUser(null);
          setWorkspaces([]);
          setWorkspace(null);
          setView("login");
          return;
        }
        setUser({
          id: current.id,
          email: current.email ?? "",
          name: String(
            current.user_metadata?.full_name ??
              current.user_metadata?.name ??
              current.email?.split("@")[0] ??
              "",
          ),
        });
        void loadWorkspaces(current.id).catch((e) => setError(e.message));
      },
    );
    void supabase.auth
      .getUser()
      .then(async ({ data: result, error: authError }) => {
        const signedInUser = result.user;
        if (authError) setError(authError.message);
        if (signedInUser)
          setUser({
            id: signedInUser.id,
            email: signedInUser.email ?? "",
            name: String(
              signedInUser.user_metadata?.full_name ??
                signedInUser.user_metadata?.name ??
                signedInUser.email?.split("@")[0] ??
                "",
            ),
          });
        if (signedInUser)
          void loadWorkspaces(signedInUser.id).catch((e) =>
            setError(e.message),
          );
      });
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("authError");
    if (authError) setError(authError);
    return () => listener.subscription.unsubscribe();
  }, [supabase, loadWorkspaces]);
  useEffect(() => {
    if (workspace) void loadWorkspace(workspace);
  }, [workspace, loadWorkspace]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function navigate(target: View) {
    setView(target);
    setSearch("");
  }
  async function authSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result =
        authMode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: String(
                    new FormData(e.currentTarget).get("name") ?? "",
                  ),
                },
                emailRedirectTo: `${location.origin}/auth/callback`,
              },
            });
      if (result.error) throw result.error;
      if (authMode === "signup" && !result.data.session)
        setToast("Cek email untuk memverifikasi akun sebelum masuk.");
      else setToast("Berhasil masuk.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Autentikasi gagal.");
    } finally {
      setBusy(false);
    }
  }
  async function googleLogin() {
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (authError) setError(authError.message);
  }
  async function createWorkspace(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const name = String(new FormData(e.currentTarget).get("workspace")).trim();
    const { data: id, error: createError } = await supabase.rpc(
      "create_workspace",
      { workspace_name: name },
    );
    if (createError) setError(createError.message);
    else if (id) {
      await loadWorkspaces(user!.id);
      const created = { id, name, role: "owner" as const, memberId: "" };
      const { data: rows } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", id)
        .eq("profile_id", user!.id)
        .is("left_at", null)
        .single();
      created.memberId = rows?.id ?? "";
      setWorkspaces((prev) =>
        prev.some((item) => item.id === id)
          ? prev.map((item) => (item.id === id ? created : item))
          : [...prev, created],
      );
      setWorkspace(created);
      setView("dashboard");
    }
    setBusy(false);
  }
  async function refresh() {
    if (workspace) await loadWorkspace(workspace);
  }
  async function saveMeeting(meeting: Meeting) {
    if (!workspace) return;
    const exists = meeting.id && data.meetings.some((m) => m.id === meeting.id);
    const { data: result, error: saveError } = await supabase.rpc(
      "save_meeting_with_participants",
      {
        target_meeting: exists ? meeting.id : null,
        target_workspace: workspace.id,
        meeting_title: meeting.title,
        meeting_notes: meeting.notes,
        meeting_scheduled_at: meeting.time,
        participant_member_ids: meeting.participants,
      },
    );
    if (saveError) {
      setError(saveError.message);
      return;
    }
    const id = result ?? meeting.id;
    setEditor(null);
    setSelectedId(id);
    await refresh();
    setView("detail");
    setToast("Meeting tersimpan.");
  }
  async function commitAction(item: ActionItem) {
    if (!workspace) return;
    const exists = data.actions.some((a) => a.id === item.id);
    const { data: id, error: saveError } = await supabase.rpc(
      "save_action_item_with_reminders",
      {
        target_action_item: exists ? item.id : null,
        target_meeting: item.meetingId,
        target_owner_member: item.owner,
        item_title: item.title,
        item_description: item.description,
        item_status: statusToDb[item.status],
        item_due_at: item.due || null,
        item_completed_at:
          item.status === "Selesai" ? new Date().toISOString() : null,
        reminder_schedule: item.reminders,
      },
    );
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setEditor(null);
    setPending(null);
    await refresh();
    setToast("Action item tersimpan.");
  }
  function saveAction(item: ActionItem) {
    const previous = data.actions.find((a) => a.id === item.id);
    if (
      item.status === "Selesai" &&
      previous?.status !== "Selesai" &&
      item.reminders.some((r) => new Date(r).getTime() > now)
    ) {
      setPending(item);
      setKeepReminders(false);
      setEditor(null);
      return;
    }
    void commitAction(item);
  }
  async function toggleArchive(meeting: Meeting) {
    const { error: updateError } = await supabase
      .from("meetings")
      .update({
        archived_at: meeting.archived ? null : new Date().toISOString(),
      })
      .eq("id", meeting.id);
    if (updateError) setError(updateError.message);
    else {
      await refresh();
      setToast(
        meeting.archived ? "Meeting dipulihkan." : "Meeting masuk Archive.",
      );
    }
  }
  async function markRead(notification: Notification) {
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notification.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }
  async function updateReminderPreference(enabled: boolean) {
    if (!currentMember) return;
    const { error: updateError } = await supabase.rpc(
      "update_email_reminders",
      { target_member: currentMember.id, enabled },
    );
    if (updateError) setError(updateError.message);
    else {
      await refresh();
      setToast(
        `Preferensi email Reminder ${enabled ? "diaktifkan" : "dinonaktifkan"}.`,
      );
    }
  }
  async function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!workspace) return;
    setBusy(true);
    const form = e.currentTarget;
    const inviteEmail = String(new FormData(form).get("email"));
    const response = await fetch(
      `/api/workspaces/${workspace.id}/invitations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      },
    );
    const result = await response.json();
    setBusy(false);
    if (!response.ok) setError(result.error ?? "Undangan gagal.");
    else {
      form.reset();
      await refresh();
      setToast(`Undangan dikirim ke ${inviteEmail}.`);
    }
  }
  async function changeRole(member: Member) {
    if (!workspace) return;
    const role = member.role === "owner" ? "member" : "owner";
    const { error: rpcError } = await supabase.rpc(
      "set_workspace_member_role",
      {
        target_workspace: workspace.id,
        target_member: member.id,
        new_role: role,
      },
    );
    if (rpcError) setError(rpcError.message);
    else {
      await refresh();
      setToast(
        `${member.name} sekarang ${role === "owner" ? "Owner" : "Member"}.`,
      );
    }
  }
  async function removeMember() {
    if (!workspace || !removing) return;
    const assignments = Object.fromEntries(
      data.actions
        .filter(
          (a) =>
            a.owner === removing.id && a.status !== "Selesai" && !a.archived,
        )
        .map((a) => [a.id, reassign[a.id]]),
    );
    const { error: rpcError } = await supabase.rpc("remove_workspace_member", {
      target_workspace: workspace.id,
      target_member: removing.id,
      reassignments: assignments,
    });
    if (rpcError) setError(rpcError.message);
    else {
      setRemoving(null);
      await refresh();
      setToast(`${removing.name} dikeluarkan dari Workspace.`);
    }
  }

  if (!user)
    return (
      <main className="auth">
        <section className="auth-main">
          <Brand />
          <div className="auth-form">
            <h1>
              Meeting selesai.
              <br />
              Langkah berikutnya jelas.
            </h1>
            <p>
              Satu tempat untuk catatan, Owner, dan setiap tindak lanjut tim.
            </p>
            <button className="secondary full" onClick={googleLogin}>
              Lanjut dengan Google
            </button>
            <div className="divider">
              atau {authMode === "login" ? "masuk" : "daftar"} dengan email
            </div>
            <form onSubmit={authSubmit}>
              {authMode === "signup" && (
                <Field label="Nama">
                  <input name="name" required autoComplete="name" />
                </Field>
              )}
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </Field>
              <Field label="Kata sandi">
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    authMode === "login" ? "current-password" : "new-password"
                  }
                />
              </Field>
              <button className="primary full" disabled={busy}>
                {authMode === "login" ? "Masuk ke Workspace" : "Buat akun"}
                <ChevronRight size={18} />
              </button>
            </form>
            <button
              className="text-button"
              onClick={() =>
                setAuthMode(authMode === "login" ? "signup" : "login")
              }
            >
              {authMode === "login"
                ? "Belum punya akun? Daftar"
                : "Sudah punya akun? Masuk"}
            </button>
            {error && (
              <p className="error-text" role="alert">
                {error}
              </p>
            )}
            <p className="demo-note">
              Akun dan Workspace memakai Supabase. Konfirmasi email mungkin
              diperlukan.
            </p>
          </div>
          <span className="auth-footer">
            Sedikit lebih teratur. Selangkah lebih maju.
          </span>
        </section>
        <aside className="auth-story">
          <span className="story-label">
            <span className="live-dot" /> Ruang untuk pekerjaan yang berarti
          </span>
          <h2>
            Dari percakapan,
            <br />
            jadi kemajuan.
          </h2>
          <div className="story-note">
            <span>
              <CalendarDays size={18} /> Workspace tim
            </span>
            <h3>
              Ide bagus layak
              <br />
              ditindaklanjuti.
            </h3>
            <div>
              <CheckCheck size={20} /> Catatan tersimpan
            </div>
            <div>
              <Users size={20} /> Owner ditentukan
            </div>
            <div>
              <ListTodo size={20} /> Langkah berikutnya siap
            </div>
          </div>
          <p>Catat bersama. Tindak lanjuti dengan tenang.</p>
        </aside>
      </main>
    );

  if (!workspace || view === "workspace")
    return (
      <main className="choose">
        <section>
          <Brand />
          <h1>Workspace kamu.</h1>
          <p>Pilih Workspace atau buat ruang kerja baru.</p>
          {workspaces.map((item) => (
            <button
              className="workspace-card"
              key={item.id}
              onClick={() => {
                setWorkspace(item);
                setView("dashboard");
              }}
            >
              <span className="workspace-mark">{item.name[0]}</span>
              <span>
                <strong>{item.name}</strong>
                <small>
                  Peran: {item.role === "owner" ? "Owner" : "Member"}
                </small>
              </span>
              <ChevronRight />
            </button>
          ))}
          <form onSubmit={createWorkspace}>
            <Field label="Nama Workspace baru">
              <input
                name="workspace"
                required
                minLength={1}
                maxLength={120}
                placeholder="Contoh: Tim Produk"
              />
            </Field>
            <button className="primary full" disabled={busy}>
              <Plus size={17} /> Buat Workspace
            </button>
          </form>
          <button
            className="text-button"
            onClick={() => void supabase.auth.signOut()}
          >
            <LogOut size={16} /> Keluar
          </button>
          {error && <p className="error-text">{error}</p>}
        </section>
      </main>
    );

  const actionRows = (items: ActionItem[]) =>
    items.length ? (
      <div className="action-list">
        {items.map((item) => (
          <article className="action-row" key={item.id}>
            <button
              className={`completion ${item.status === "Selesai" ? "done" : ""}`}
              aria-label={`Tandai ${item.title} selesai`}
              onClick={() =>
                saveAction({
                  ...item,
                  status: item.status === "Selesai" ? "Belum Mulai" : "Selesai",
                })
              }
            >
              {item.status === "Selesai" && <Check size={15} />}
            </button>
            <div className="action-info">
              <button
                className="item-title"
                onClick={() => setEditor({ kind: "action", initial: item })}
              >
                {item.title}
              </button>
              <button
                className="meeting-link"
                onClick={() => {
                  setSelectedId(item.meetingId);
                  setView("detail");
                }}
              >
                {data.meetings.find((m) => m.id === item.meetingId)?.title ??
                  "Meeting"}
              </button>
              <span className={`deadline ${overdue(item, now) ? "late" : ""}`}>
                <CalendarDays size={13} />
                {formatDate(item.due)}
                {overdue(item, now) && " · Terlambat"}
                {item.reminders.length > 0 && (
                  <span className="reminder-count">
                    <Bell size={12} />
                    {item.reminders.length}
                  </span>
                )}
              </span>
            </div>
            <span className="row-owner">
              <Avatar name={nameMap[item.owner] ?? "Member"} />
              <span>{(nameMap[item.owner] ?? "Member").split(" ")[0]}</span>
            </span>
            <select
              aria-label={`Status ${item.title}`}
              className={`status ${item.status === "Selesai" ? "complete" : item.status === "Dikerjakan" ? "progress" : ""}`}
              value={item.status}
              onChange={(e) =>
                saveAction({ ...item, status: e.target.value as Status })
              }
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </article>
        ))}
      </div>
    ) : (
      <Empty text="Belum ada Action item." />
    );
  const notificationSettings = (
    <div className="email-setting">
      <span className="setting-icon">
        <Mail size={22} />
      </span>
      <div>
        <h3>Email Reminder</h3>
        <p>Simpan preferensi email Reminder untuk akunmu.</p>
        <small>Jadwal tersimpan; pengiriman email belum aktif.</small>
      </div>
      <button
        className={`switch ${currentMember?.reminders ? "on" : ""}`}
        role="switch"
        aria-checked={!!currentMember?.reminders}
        aria-label="Email Reminder"
        onClick={() => void updateReminderPreference(!currentMember?.reminders)}
      >
        <span />
      </button>
    </div>
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="brand-button" onClick={() => navigate("dashboard")}>
          <Brand />
        </button>
        <button
          className="workspace-select"
          onClick={() => navigate("workspace")}
        >
          <span className="workspace-mark">{workspace.name[0]}</span>
          <span>
            <strong>{workspace.name}</strong>
            <small>
              Workspace · {workspace.role === "owner" ? "Owner" : "Member"}
            </small>
          </span>
          <ChevronRight size={16} />
        </button>
        <nav aria-label="Navigasi utama">
          {nav.map(({ view: target, label, icon: Icon }) => (
            <button
              key={target}
              className={`nav-item ${view === target || (target === "meetings" && view === "detail") ? "active" : ""}`}
              onClick={() => navigate(target)}
            >
              <Icon size={19} />
              {label}
              {target === "notifications" && unread > 0 && (
                <span className="count">{unread}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${view === "settings" ? "active" : ""}`}
            onClick={() => navigate("settings")}
          >
            <Settings2 size={18} />
            Pengaturan Workspace
          </button>
          <div className="profile">
            <Avatar name={user.name} />
            <span>
              <strong>{user.name}</strong>
              <small>
                {currentMember?.role === "owner" ? "Owner" : "Member"}
              </small>
            </span>
            <button
              className="icon"
              aria-label="Keluar"
              onClick={() => void supabase.auth.signOut()}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <button
            className="mobile-brand brand-button"
            onClick={() => navigate("workspace")}
          >
            <Brand />
          </button>
          <span className="breadcrumb">
            Workspace <ChevronRight size={13} />{" "}
            <strong>{workspace.name}</strong>
          </span>
          <div className="topbar-actions">
            <button
              className="icon notification-button"
              aria-label={`Notifikasi, ${unread} belum dibaca`}
              onClick={() => navigate("notifications")}
            >
              <Bell size={20} />
              {unread > 0 && <i />}
            </button>
            <Avatar name={user.name} />
          </div>
        </header>
        <main className="content" id="main-content">
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button
                className="icon"
                aria-label="Tutup pesan"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}
          {view === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="date-line">
                    {new Date(now).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <h1>Selamat datang, {user.name.split(" ")[0]}.</h1>
                  <p>Setiap tindak lanjut tim tersimpan di {workspace.name}.</p>
                </div>
                <button
                  className="primary"
                  onClick={() => setEditor({ kind: "meeting" })}
                >
                  <Plus size={18} />
                  Meeting baru
                </button>
              </div>
              <div className="stats">
                <Metric
                  label="Action item aktif"
                  value={activeActions.length}
                  note="Langkah yang sedang berjalan"
                />
                <Metric
                  label="Mendekati deadline"
                  value={soon.length}
                  note="Dalam 48 jam mendatang"
                />
                <Metric
                  label="Terlambat"
                  value={late.length}
                  note="Perlu perhatian tim"
                  alert
                />
                <Metric
                  label="Selesai"
                  value={completed}
                  note="Satu langkah lebih maju"
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel my-actions">
                  <div className="section-head">
                    <div>
                      <h2>Tugas saya</h2>
                      <p>Action item yang menjadi tanggung jawabmu.</p>
                    </div>
                  </div>
                  {actionRows(
                    activeActions.filter((a) => a.owner === workspace.memberId),
                  )}
                </section>
                <section className="progress-panel">
                  <div>
                    <h2>Selangkah demi selangkah.</h2>
                    <p>
                      Setiap tindak lanjut yang selesai membawa tim lebih dekat.
                    </p>
                  </div>
                  <div className="progress-caption">
                    <span>Progres tim</span>
                    <strong>
                      {liveActions.length
                        ? Math.round((completed / liveActions.length) * 100)
                        : 0}
                      %
                    </strong>
                    <progress value={completed} max={liveActions.length || 1} />
                  </div>
                </section>
                <section className="panel">
                  <div className="section-head">
                    <div>
                      <h2>Mendekati deadline</h2>
                      <p>Prioritaskan 48 jam ke depan.</p>
                    </div>
                  </div>
                  {actionRows(soon)}
                </section>
                <section className="panel">
                  <div className="section-head">
                    <div>
                      <h2>Perlu perhatian</h2>
                      <p>Action item yang melewati deadline.</p>
                    </div>
                    <span className="late badge">{late.length} terlambat</span>
                  </div>
                  {actionRows(late)}
                </section>
              </div>
              <section className="recent">
                <div className="section-head">
                  <h2>Meeting terbaru</h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("meetings")}
                  >
                    Semua Meeting <ChevronRight size={16} />
                  </button>
                </div>
                {data.meetings
                  .filter((m) => !m.archived)
                  .slice(0, 3)
                  .map((m) => (
                    <button
                      className="recent-meeting"
                      key={m.id}
                      onClick={() => {
                        setSelectedId(m.id);
                        setView("detail");
                      }}
                    >
                      <CalendarDays />
                      <span>
                        <strong>{m.title}</strong>
                        <small>
                          {formatDate(m.time)} ·{" "}
                          {
                            data.actions.filter((a) => a.meetingId === m.id)
                              .length
                          }{" "}
                          Action item
                        </small>
                      </span>
                      <ChevronRight />
                    </button>
                  ))}
              </section>
            </>
          )}
          {view === "meetings" && (
            <>
              <PageHeading
                title="Meeting"
                description="Catatan dan keputusan Workspace."
                action={
                  <button
                    className="primary"
                    onClick={() => setEditor({ kind: "meeting" })}
                  >
                    <Plus size={18} />
                    Meeting baru
                  </button>
                }
              />
              <div className="toolbar">
                <SearchBox
                  value={search}
                  change={setSearch}
                  placeholder="Cari Meeting…"
                />
                <ArchiveTabs value={filter} change={setFilter} />
              </div>
              <div className="meeting-list">
                {data.meetings
                  .filter(
                    (m) =>
                      m.archived === (filter === "archived") &&
                      m.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((m) => (
                    <article className="meeting-card" key={m.id}>
                      <CalendarDays size={24} />
                      <div>
                        <button
                          className="item-title"
                          onClick={() => {
                            setSelectedId(m.id);
                            setView("detail");
                          }}
                        >
                          {m.title}
                        </button>
                        <p>{m.notes || "Belum ada catatan."}</p>
                        <small>
                          {formatDate(m.time)} · {m.participants.length}{" "}
                          Participant ·{" "}
                          {
                            data.actions.filter((a) => a.meetingId === m.id)
                              .length
                          }{" "}
                          Action item
                        </small>
                      </div>
                      <button
                        className="secondary"
                        onClick={() => void toggleArchive(m)}
                      >
                        <Archive size={16} />
                        {m.archived ? "Pulihkan" : "Archive"}
                      </button>
                    </article>
                  ))}
              </div>
            </>
          )}
          {view === "detail" && selected && (
            <>
              <button
                className="text-button back"
                onClick={() => navigate("meetings")}
              >
                ‹ Semua Meeting
              </button>
              <PageHeading
                title={selected.title}
                description={`${formatDate(selected.time)}${selected.archived ? " · Archive" : ""}`}
                action={
                  <div className="button-group">
                    <button
                      className="secondary"
                      onClick={() =>
                        setEditor({ kind: "meeting", initial: selected })
                      }
                    >
                      Edit Meeting
                    </button>
                    <button
                      className="secondary"
                      onClick={() => void toggleArchive(selected)}
                    >
                      <Archive size={16} />
                      {selected.archived ? "Pulihkan" : "Archive"}
                    </button>
                  </div>
                }
              />
              <div className="detail-grid">
                <section className="panel notes-panel">
                  <h2>Catatan Meeting</h2>
                  <p className="meeting-notes">
                    {selected.notes || "Belum ada catatan."}
                  </p>
                  <h3>Participant Meeting</h3>
                  <div className="participants">
                    {selected.participants.map((id) => (
                      <span key={id}>
                        <Avatar name={nameMap[id] ?? "Member"} />
                        {nameMap[id] ?? "Member"}
                      </span>
                    ))}
                  </div>
                </section>
                <section className="panel">
                  <div className="section-head">
                    <div>
                      <h2>Action item</h2>
                      <p>Tindak lanjut dari Meeting ini.</p>
                    </div>
                    <button
                      className="primary"
                      onClick={() =>
                        setEditor({ kind: "action", meetingId: selected.id })
                      }
                    >
                      <Plus size={17} />
                      Tambah
                    </button>
                  </div>
                  {actionRows(
                    data.actions.filter(
                      (a) => a.meetingId === selected.id && !a.archived,
                    ),
                  )}
                </section>
              </div>
            </>
          )}
          {view === "actions" && (
            <>
              <PageHeading
                title="Action item"
                description="Owner, progres, dan deadline tindak lanjut."
                action={
                  <button
                    className="primary"
                    onClick={() => setEditor({ kind: "action" })}
                  >
                    <Plus size={18} />
                    Action item baru
                  </button>
                }
              />
              <div className="toolbar">
                <SearchBox
                  value={search}
                  change={setSearch}
                  placeholder="Cari Action item…"
                />
                <button
                  className="text-button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setOwnerFilter("all");
                    setMeetingFilter("all");
                    setDeadlineFilter("all");
                  }}
                >
                  Reset filter
                </button>
              </div>
              <div className="filters">
                <label>
                  Owner
                  <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                  >
                    <option value="all">Semua Owner</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Semua status</option>
                    {statuses.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Meeting
                  <select
                    value={meetingFilter}
                    onChange={(e) => setMeetingFilter(e.target.value)}
                  >
                    <option value="all">Semua Meeting</option>
                    {data.meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Deadline
                  <select
                    value={deadlineFilter}
                    onChange={(e) => setDeadlineFilter(e.target.value)}
                  >
                    <option value="all">Semua deadline</option>
                    <option value="soon">Dalam 48 jam</option>
                    <option value="late">Terlambat</option>
                    <option value="none">Tanpa deadline</option>
                  </select>
                </label>
              </div>
              <section className="panel">
                {actionRows(
                  data.actions.filter(
                    (a) =>
                      !a.archived &&
                      a.title.toLowerCase().includes(search.toLowerCase()) &&
                      (statusFilter === "all" || a.status === statusFilter) &&
                      (ownerFilter === "all" || a.owner === ownerFilter) &&
                      (meetingFilter === "all" ||
                        a.meetingId === meetingFilter) &&
                      (deadlineFilter === "all" ||
                        (deadlineFilter === "soon" && upcoming(a, now)) ||
                        (deadlineFilter === "late" && overdue(a, now)) ||
                        (deadlineFilter === "none" && !a.due)),
                  ),
                )}
              </section>
            </>
          )}
          {view === "notifications" && (
            <>
              <PageHeading
                title="Notifikasi"
                description={`${unread} Notification belum dibaca.`}
                action={
                  <button
                    className="secondary"
                    disabled={!unread}
                    onClick={async () => {
                      for (const n of data.notifications.filter((x) => !x.read))
                        await markRead(n);
                    }}
                  >
                    <CheckCheck size={18} />
                    Tandai semua terbaca
                  </button>
                }
              />
              <section className="panel notifications">
                {data.notifications.map((n) => (
                  <article key={n.id} className={n.read ? "read" : "unread"}>
                    <span className="meeting-icon">
                      <Bell size={19} />
                    </span>
                    <div>
                      <button
                        className="item-title"
                        onClick={() => {
                          void markRead(n);
                          const item = data.actions.find(
                            (a) => a.id === n.actionId,
                          );
                          if (item)
                            setEditor({ kind: "action", initial: item });
                        }}
                      >
                        {n.title}
                      </button>
                      <small>
                        {formatDate(n.time)} ·{" "}
                        {n.read ? "Sudah dibaca" : "Belum dibaca"}
                      </small>
                    </div>
                    {!n.read && (
                      <button
                        className="icon"
                        aria-label="Tandai terbaca"
                        onClick={() => void markRead(n)}
                      >
                        <Check />
                      </button>
                    )}
                  </article>
                ))}
                {!data.notifications.length && (
                  <Empty text="Belum ada Notification. Reminder tersimpan, tetapi belum menghasilkan Notification otomatis." />
                )}
              </section>
              {notificationSettings}
            </>
          )}
          {view === "settings" && (
            <>
              <PageHeading
                title="Pengaturan Workspace"
                description={`${workspace.name} · preferensi akun dan keanggotaan.`}
              />
              {notificationSettings}
              <section className="panel members-panel">
                <h2>Member Workspace</h2>
                <p>
                  {isOwner
                    ? "Undang Member, kelola Owner, atau alihkan Action item sebelum mengeluarkan Member."
                    : "Participant Meeting dipilih dari Member Workspace."}
                </p>
                {isOwner && (
                  <form className="invite-form" onSubmit={invite}>
                    <Field label="Undang lewat email">
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="nama@contoh.com"
                      />
                    </Field>
                    <button className="primary" disabled={busy}>
                      <Mail size={16} />
                      Kirim undangan
                    </button>
                  </form>
                )}
                {members.map((m) => (
                  <div className="member-row" key={m.id}>
                    <Avatar name={m.name} />
                    <strong>
                      {m.name}
                      {m.profileId === user.id ? " (kamu)" : ""}
                    </strong>
                    <span>{m.role === "owner" ? "Owner" : "Member"}</span>
                    {isOwner && m.profileId !== user.id && (
                      <div className="button-group">
                        <button
                          className="secondary"
                          onClick={() => void changeRole(m)}
                        >
                          {m.role === "owner"
                            ? "Jadikan Member"
                            : "Jadikan Owner"}
                        </button>
                        <button
                          className="secondary"
                          onClick={() => {
                            setRemoving(m);
                            setReassign({});
                          }}
                        >
                          Keluarkan
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!members.length && <Empty text="Belum ada Member lain." />}
              </section>
              {isOwner && (
                <section className="panel members-panel">
                  <h2>Undangan</h2>
                  {invitations.map((inv) => (
                    <div className="member-row" key={inv.id}>
                      <Mail />
                      <strong>{inv.invitee_email}</strong>
                      <span>{inv.status}</span>
                    </div>
                  ))}
                  {!invitations.length && <p>Belum ada undangan.</p>}
                </section>
              )}
              <button
                className="secondary"
                onClick={() => navigate("workspace")}
              >
                Pilih Workspace <ChevronRight size={16} />
              </button>
            </>
          )}
          {busy && <p className="demo-note">Memuat data Workspace…</p>}
          <footer className="page-footer">
            {workspace.name}
            <span>
              Data tersimpan di Supabase · Reminder belum mengirim email
            </span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navigasi mobile">
        {nav.map(({ view: target, label, icon: Icon }) => (
          <button
            className={
              view === target || (view === "detail" && target === "meetings")
                ? "active"
                : ""
            }
            key={target}
            onClick={() => navigate(target)}
          >
            <Icon size={20} />
            <span>
              {label}
              {target === "notifications" && unread ? ` (${unread})` : ""}
            </span>
          </button>
        ))}
        <button onClick={() => navigate("settings")}>
          <Settings2 size={20} />
          <span>Pengaturan</span>
        </button>
      </nav>
      {editor && (
        <Modal
          title={
            editor.kind === "meeting"
              ? editor.initial
                ? "Edit Meeting"
                : "Meeting baru"
              : editor.initial
                ? "Edit Action item"
                : "Action item baru"
          }
          close={() => setEditor(null)}
        >
          {editor.kind === "meeting" ? (
            <MeetingForm
              initial={editor.initial}
              members={members.map(({ id, name }) => ({ id, name }))}
              save={saveMeeting}
              close={() => setEditor(null)}
            />
          ) : (
            <ActionForm
              initial={editor.initial}
              meetingId={editor.meetingId}
              meetings={data.meetings}
              members={members.map(({ id, name }) => ({ id, name }))}
              save={saveAction}
              close={() => setEditor(null)}
            />
          )}
        </Modal>
      )}
      {pending && (
        <Modal title="Selesaikan Action item?" close={() => setPending(null)}>
          <p>
            <strong>{pending.title}</strong>
          </p>
          <p>
            {
              pending.reminders.filter((r) => new Date(r).getTime() > now)
                .length
            }{" "}
            Reminder masih dijadwalkan.
          </p>
          <label
            className={`radio-option cancel-option ${!keepReminders ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="reminder-choice"
              checked={!keepReminders}
              onChange={() => setKeepReminders(false)}
            />
            <span>
              <strong>Batalkan Reminder tersisa</strong>
              <small>Hapus jadwal mendatang.</small>
            </span>
          </label>
          <label
            className={`radio-option keep-option ${keepReminders ? "selected" : ""}`}
          >
            <input
              type="radio"
              name="reminder-choice"
              checked={keepReminders}
              onChange={() => setKeepReminders(true)}
            />
            <span>
              <strong>Pertahankan Reminder tersisa</strong>
              <small>Simpan jadwal pada Action item selesai.</small>
            </span>
          </label>
          <div className="form-actions">
            <button className="secondary" onClick={() => setPending(null)}>
              Kembali
            </button>
            <button
              className="primary"
              onClick={() =>
                void commitAction({
                  ...pending,
                  reminders: keepReminders
                    ? pending.reminders
                    : pending.reminders.filter(
                        (r) => new Date(r).getTime() <= now,
                      ),
                })
              }
            >
              Tandai Selesai
            </button>
          </div>
        </Modal>
      )}
      {removing && (
        <Modal
          title={`Keluarkan ${removing.name}?`}
          close={() => setRemoving(null)}
        >
          <p>
            Setiap Action item aktif harus dialihkan ke Member lain sebelum
            pengeluaran.
          </p>
          {data.actions
            .filter(
              (a) =>
                a.owner === removing.id &&
                a.status !== "Selesai" &&
                !a.archived,
            )
            .map((a) => (
              <Field key={a.id} label={a.title}>
                <select
                  required
                  value={reassign[a.id] ?? ""}
                  onChange={(e) =>
                    setReassign((r) => ({ ...r, [a.id]: e.target.value }))
                  }
                >
                  <option value="">Pilih Owner baru</option>
                  {members
                    .filter((m) => m.id !== removing.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </Field>
            ))}
          <div className="form-actions">
            <button className="secondary" onClick={() => setRemoving(null)}>
              Batal
            </button>
            <button className="primary" onClick={() => void removeMember()}>
              Alihkan & keluarkan
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={18} />
          {toast}
        </div>
      )}
    </div>
  );
}
function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function Metric({
  label,
  value,
  note,
  alert,
}: {
  label: string;
  value: number;
  note: string;
  alert?: boolean;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong className={alert && value ? "late" : ""}>
        {value.toString().padStart(2, "0")}
      </strong>
      <small>{note}</small>
    </div>
  );
}
function SearchBox({
  value,
  change,
  placeholder,
}: {
  value: string;
  change: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => change(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function ArchiveTabs({
  value,
  change,
}: {
  value: string;
  change: (value: string) => void;
}) {
  return (
    <div className="tabs">
      <button
        className={value === "all" ? "selected" : ""}
        onClick={() => change("all")}
      >
        Aktif
      </button>
      <button
        className={value === "archived" ? "selected" : ""}
        onClick={() => change("archived")}
      >
        Archive
      </button>
    </div>
  );
}
