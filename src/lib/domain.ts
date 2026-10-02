export const statuses = ["Belum Mulai", "Dikerjakan", "Selesai"] as const;
export type Status = (typeof statuses)[number];
export type Meeting = {
  id: string;
  title: string;
  time: string;
  notes: string;
  participants: string[];
  archived: boolean;
};
export type ActionItem = {
  id: string;
  meetingId: string;
  title: string;
  description: string;
  /** Workspace Member id; the page resolves this id to a display name. */
  owner: string;
  due: string;
  status: Status;
  reminders: string[];
  archived: boolean;
};
export type Notification = {
  id: string;
  actionId: string;
  title: string;
  time: string;
  read: boolean;
};
export function formatDate(value: string) {
  return value
    ? new Date(value).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Tanpa deadline";
}
export function localInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
export const globalTime = (value: string) =>
  value ? new Date(value).toISOString() : "";
export const overdue = (item: ActionItem, now: number) =>
  !item.archived &&
  item.status !== "Selesai" &&
  !!item.due &&
  new Date(item.due).getTime() < now;
export const upcoming = (item: ActionItem, now: number) =>
  !item.archived &&
  item.status !== "Selesai" &&
  !!item.due &&
  new Date(item.due).getTime() >= now &&
  new Date(item.due).getTime() <= now + 48 * 3600000;
