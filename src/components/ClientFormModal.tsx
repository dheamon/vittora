"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { ClientDTO, ClientType } from "@/lib/types";
import { generateAisPassword } from "@/lib/ais";
import {
  isValidEmail,
  isValidGst,
  isValidPan,
  isValidPhone,
} from "@/lib/validation";
import { useToast } from "./ToastProvider";

interface Props {
  editing: ClientDTO | null; // null => add mode
  onClose: () => void;
  onSaved: (client: ClientDTO) => void;
}

type FormState = {
  name: string;
  pan: string;
  password: string;
  aadhaar: string;
  dob: string;
  dof: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  userId: string;
  portalPassword: string;
};

function initial(editing: ClientDTO | null): FormState {
  return {
    name: editing?.name ?? "",
    pan: editing?.pan ?? "",
    password: editing?.password ?? "",
    aadhaar: editing?.aadhaar ?? "",
    dob: editing?.dob ?? "",
    dof: editing?.dof ?? "",
    phone: editing?.phone ?? "",
    email: editing?.email ?? "",
    address: editing?.address ?? "",
    gstNumber: editing?.gstNumber ?? "",
    userId: editing?.userId ?? "",
    portalPassword: editing?.portalPassword ?? "",
  };
}

export default function ClientFormModal({ editing, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [type, setType] = useState<ClientType>(editing?.type ?? "INDIVIDUAL");
  const [form, setForm] = useState<FormState>(() => initial(editing));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof FormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const aisPreview = useMemo(() => {
    if (type === "COMPANY") return "N/A for companies";
    const ais = generateAisPassword(form.pan, form.dob);
    return ais ?? "—";
  }, [type, form.pan, form.dob]);

  // Inline validation hints.
  const panOk = !form.pan || isValidPan(form.pan);
  const emailOk = !form.email || isValidEmail(form.email);
  const phoneOk = !form.phone || isValidPhone(form.phone);
  const gstOk = !form.gstNumber || isValidGst(form.gstNumber);

  async function submit() {
    const name = form.name.trim();
    const pan = form.pan.trim().toUpperCase();
    if (!name) {
      toast("Name required", "Enter the client name", "err");
      return;
    }
    if (!isValidPan(pan)) {
      toast("Invalid PAN", "Use format AAAAA0000A", "err");
      return;
    }
    if (!emailOk) {
      toast("Invalid email", "Check the email address", "err");
      return;
    }
    if (!gstOk) {
      toast("Invalid GST", "Check the 15-char GSTIN", "err");
      return;
    }

    setSaving(true);
    const payload = {
      type,
      name,
      pan,
      password: form.password,
      aadhaar: form.aadhaar,
      dob: type === "INDIVIDUAL" ? form.dob : "",
      dof: type === "COMPANY" ? form.dof : "",
      phone: form.phone,
      email: form.email,
      address: form.address,
      gstNumber: form.gstNumber,
      userId: form.userId,
      portalPassword: form.portalPassword,
    };

    try {
      const res = await fetch(
        editing ? `/api/clients/${editing.id}` : "/api/clients",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(
          res.status === 409 ? "Duplicate PAN" : "Could not save",
          data.error || "Please check the form",
          "err",
        );
        setSaving(false);
        return;
      }
      toast(
        editing ? "Client updated" : "Client added",
        editing ? `${name}'s record saved` : `${name} added to the register`,
      );
      onSaved(data as ClientDTO);
    } catch {
      toast("Network error", "Please try again", "err");
      setSaving(false);
    }
  }

  return (
    <div
      className="overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{editing ? "Edit client" : "Add client"}</h3>
          <button className="close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-sec">Client type</div>
          <div className="seg" style={{ marginBottom: 4 }}>
            <button
              type="button"
              className={type === "INDIVIDUAL" ? "on" : ""}
              onClick={() => setType("INDIVIDUAL")}
            >
              Individual
            </button>
            <button
              type="button"
              className={type === "COMPANY" ? "on" : ""}
              onClick={() => setType("COMPANY")}
            >
              Company
            </button>
          </div>

          <div className="form-sec">Basic details</div>
          <div className="form-grid">
            <div className="fg span2">
              <label>
                Client name <span className="req">*</span>
              </label>
              <input
                value={form.name}
                placeholder="Full legal name"
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div className="fg">
              <label>
                PAN <span className="req">*</span>
              </label>
              <input
                className={`mono ${!panOk ? "bad" : ""}`}
                value={form.pan}
                placeholder="ABCDE1234F"
                maxLength={10}
                onChange={(e) => set("pan", e.target.value.toUpperCase())}
              />
              <span className={`hint ${!panOk ? "err" : ""}`}>
                {form.pan
                  ? panOk
                    ? "Valid PAN"
                    : "Format: AAAAA0000A"
                  : "10-char format: AAAAA0000A"}
              </span>
            </div>
            <div className="fg">
              <label>Login password</label>
              <input
                value={form.password}
                placeholder="Set a password"
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
            <div className="fg">
              <label>Aadhaar</label>
              <input
                className="mono"
                value={form.aadhaar}
                placeholder="0000 0000 0000"
                onChange={(e) => set("aadhaar", e.target.value)}
              />
            </div>
            {type === "INDIVIDUAL" ? (
              <div className="fg">
                <label>Date of birth</label>
                <input
                  className="mono"
                  value={form.dob}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => set("dob", e.target.value)}
                />
              </div>
            ) : (
              <div className="fg">
                <label>Date of formation</label>
                <input
                  className="mono"
                  value={form.dof}
                  placeholder="DD/MM/YYYY"
                  onChange={(e) => set("dof", e.target.value)}
                />
              </div>
            )}
            <div className="fg">
              <label>Phone</label>
              <input
                className={`mono ${!phoneOk ? "bad" : ""}`}
                value={form.phone}
                placeholder="+91 00000 00000"
                onChange={(e) => set("phone", e.target.value)}
              />
              <span className={`hint ${!phoneOk ? "err" : ""}`}>
                {form.phone && !phoneOk ? "Needs at least 10 digits" : ""}
              </span>
            </div>
            <div className="fg">
              <label>Email</label>
              <input
                className={!emailOk ? "bad" : ""}
                value={form.email}
                placeholder="name@example.com"
                onChange={(e) => set("email", e.target.value)}
              />
              <span className={`hint ${!emailOk ? "err" : ""}`}>
                {form.email ? (emailOk ? "Looks good" : "Enter a valid email") : ""}
              </span>
            </div>
            <div className="fg span2">
              <label>Address</label>
              <input
                value={form.address}
                placeholder="Street, area, city, state, PIN"
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
          </div>

          <div className="form-sec">Tax &amp; portal</div>
          <div className="form-grid">
            <div className="fg">
              <label>GST number</label>
              <input
                className={`mono ${!gstOk ? "bad" : ""}`}
                value={form.gstNumber}
                placeholder="29AAAAA0000A1Z5"
                maxLength={15}
                onChange={(e) => set("gstNumber", e.target.value.toUpperCase())}
              />
              <span className={`hint ${!gstOk ? "err" : ""}`}>
                {form.gstNumber
                  ? gstOk
                    ? "Valid GSTIN"
                    : "15-char GSTIN format"
                  : ""}
              </span>
            </div>
            <div className="fg">
              <label>Portal user ID</label>
              <input
                className="mono"
                value={form.userId}
                placeholder="Portal login ID"
                onChange={(e) => set("userId", e.target.value)}
              />
            </div>
            <div className="fg span2">
              <label>Portal password</label>
              <input
                value={form.portalPassword}
                placeholder="Income-tax portal password"
                onChange={(e) => set("portalPassword", e.target.value)}
              />
            </div>
            <div className="ais-preview">
              <span className="pl">AIS password</span>
              <span className="pv">{aisPreview}</span>
              <span
                style={{ fontSize: 11, color: "var(--accent)", marginLeft: "auto" }}
              >
                Auto · PAN + DOB
              </span>
            </div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            style={{ padding: "11px 20px" }}
            disabled={saving}
            onClick={submit}
          >
            {saving ? "Saving…" : editing ? "Save changes" : "Add client"}
          </button>
        </div>
      </div>
    </div>
  );
}
