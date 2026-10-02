"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Check, X } from "lucide-react";
export function Brand() {
  return (
    <span className="brand">
      <span>
        <Check size={22} strokeWidth={3} />
      </span>
      follow<span className="brand-dot">.</span>
    </span>
  );
}
export function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar" title={name}>
      {name
        .split(" ")
        .map((s) => s[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Check size={24} />
      <p>{text}</p>
    </div>
  );
}
export function Modal({
  title,
  close,
  children,
}: {
  title: string;
  close: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    const active = document.activeElement as HTMLElement;
    el?.showModal();
    return () => {
      el?.close();
      active?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="dialog-title"
      onCancel={close}
    >
      <div className="modal-head">
        <h2 id="dialog-title">{title}</h2>
        <button aria-label="Tutup dialog" className="icon" onClick={close}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function FormActions({
  close,
  label,
}: {
  close: () => void;
  label: string;
}) {
  return (
    <div className="form-actions">
      <button className="secondary" type="button" onClick={close}>
        Batal
      </button>
      <button className="primary" type="submit">
        {label}
      </button>
    </div>
  );
}
