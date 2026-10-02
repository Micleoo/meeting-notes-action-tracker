"use client";
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  type Meeting,
  type ActionItem,
  type Status,
  statuses,
  localInput,
  globalTime,
} from "@/lib/domain";
import { Field, FormActions } from "./ui";
export function MeetingForm({
  initial,
  members,
  save,
  close,
}: {
  initial?: Meeting;
  members: { id: string; name: string }[];
  save: (meeting: Meeting) => void;
  close: () => void;
}) {
  const [participants, setParticipants] = useState(initial?.participants ?? []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim();
    if (!title) return;
    save({
      id: initial?.id ?? crypto.randomUUID(),
      title,
      time: globalTime(String(data.get("time"))),
      notes: String(data.get("notes")).trim(),
      participants,
      archived: initial?.archived ?? false,
    });
  }
  return (
    <form onSubmit={submit}>
      <Field label="Judul Meeting">
        <input
          name="title"
          required
          pattern=".*\S.*"
          defaultValue={initial?.title}
          placeholder="Contoh: Weekly project sync"
          autoFocus
        />
      </Field>
      <Field label="Waktu Meeting">
        <input
          type="datetime-local"
          name="time"
          required
          defaultValue={localInput(initial?.time ?? new Date().toISOString())}
        />
      </Field>
      <Field label="Catatan Meeting">
        <textarea
          name="notes"
          rows={5}
          defaultValue={initial?.notes}
          placeholder="Hasil diskusi dan tindak lanjut yang disepakati"
        />
      </Field>
      <fieldset>
        <legend>Participant Meeting (opsional)</legend>
        <p className="hint">
          Pilih Member Workspace yang ikut dalam Meeting ini. Untuk mengubah
          pilihan nanti, buka Edit Meeting.
        </p>
        <div className="member-grid">
          {members.map(({ id, name }) => (
            <label className="check-label" key={id}>
              <input
                type="checkbox"
                checked={participants.includes(id)}
                onChange={(e) =>
                  setParticipants((p) =>
                    e.target.checked ? [...p, id] : p.filter((n) => n !== id),
                  )
                }
              />
              {name}
            </label>
          ))}
        </div>
      </fieldset>
      <FormActions close={close} label="Simpan Meeting" />
    </form>
  );
}
export function ActionForm({
  initial,
  meetingId,
  meetings,
  members,
  save,
  close,
}: {
  initial?: ActionItem;
  meetingId?: string;
  meetings: Meeting[];
  members: { id: string; name: string }[];
  save: (item: ActionItem) => void;
  close: () => void;
}) {
  const [reminders, setReminders] = useState(
    (initial?.reminders ?? []).map(localInput),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const title = String(data.get("title")).trim();
    if (!title) return;
    save({
      id: initial?.id ?? crypto.randomUUID(),
      title,
      meetingId: String(data.get("meeting")),
      description: String(data.get("description")).trim(),
      owner: String(data.get("owner")),
      due: globalTime(String(data.get("due"))),
      status: data.get("status") as Status,
      reminders: [...new Set(reminders.map(globalTime))].sort(),
      archived: initial?.archived ?? false,
    });
  }
  return (
    <form onSubmit={submit}>
      <Field label="Meeting asal">
        <select
          name="meeting"
          aria-label="Meeting asal"
          required
          defaultValue={initial?.meetingId ?? meetingId ?? ""}
        >
          <option value="" disabled>
            Pilih Meeting
          </option>
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
              {m.archived ? " · Archive" : ""}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Judul Action item">
        <input
          name="title"
          required
          pattern=".*\S.*"
          defaultValue={initial?.title}
          autoFocus
          placeholder="Apa yang perlu ditindaklanjuti?"
        />
      </Field>
      <Field label="Deskripsi (opsional)">
        <textarea
          rows={2}
          name="description"
          defaultValue={initial?.description}
        />
      </Field>
      <div className="form-grid">
        <Field label="Owner">
          <select
            name="owner"
            aria-label="Owner"
            defaultValue={initial?.owner ?? members[0]?.id}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select
            name="status"
            aria-label="Status"
            defaultValue={initial?.status ?? statuses[0]}
          >
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Deadline (opsional)">
        <input
          type="datetime-local"
          name="due"
          defaultValue={localInput(initial?.due ?? "")}
        />
      </Field>
      <fieldset>
        <legend>Reminder</legend>
        <p className="hint">
          Pilih satu atau beberapa waktu. Semua waktu mengikuti zona waktu
          perangkat.
        </p>
        {reminders.map((value, index) => (
          <div className="reminder-input" key={index}>
            <input
              type="datetime-local"
              aria-label={`Waktu Reminder ${index + 1}`}
              required
              value={value}
              onChange={(e) =>
                setReminders((list) =>
                  list.map((r, i) => (i === index ? e.target.value : r)),
                )
              }
            />
            <button
              type="button"
              className="icon"
              aria-label={`Hapus Reminder ${index + 1}`}
              onClick={() =>
                setReminders((list) => list.filter((_, i) => i !== index))
              }
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="text-button"
          onClick={() => setReminders((list) => [...list, ""])}
        >
          <Plus size={16} />
          Tambah Reminder
        </button>
      </fieldset>
      <FormActions close={close} label="Simpan Action item" />
    </form>
  );
}
