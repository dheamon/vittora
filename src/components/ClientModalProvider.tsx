"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { ClientDTO } from "@/lib/types";
import { useToast } from "./ToastProvider";
import ClientFormModal from "./ClientFormModal";
import ConfirmDialog from "./ConfirmDialog";

/** Broadcast so any client-fetched list can refresh itself. */
export const CLIENTS_CHANGED_EVENT = "vittora:clients-changed";
export function emitClientsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CLIENTS_CHANGED_EVENT));
  }
}

interface DeleteOptions {
  onDeleted?: () => void;
}

interface ClientModalContextValue {
  openAdd: () => void;
  openEdit: (client: ClientDTO) => void;
  confirmDelete: (client: ClientDTO, options?: DeleteOptions) => void;
}

const ClientModalContext = createContext<ClientModalContextValue | null>(null);

export function useClientModal(): ClientModalContextValue {
  const ctx = useContext(ClientModalContext);
  if (!ctx)
    throw new Error("useClientModal must be used within ClientModalProvider");
  return ctx;
}

export function ClientModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientDTO | null>(null);
  const [deleting, setDeleting] = useState<ClientDTO | null>(null);
  const [deleteOpts, setDeleteOpts] = useState<DeleteOptions>({});
  const [busy, setBusy] = useState(false);

  const openAdd = useCallback(() => {
    setEditing(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((client: ClientDTO) => {
    setEditing(client);
    setFormOpen(true);
  }, []);

  const confirmDelete = useCallback(
    (client: ClientDTO, options: DeleteOptions = {}) => {
      setDeleting(client);
      setDeleteOpts(options);
    },
    [],
  );

  function afterChange() {
    emitClientsChanged();
    router.refresh();
  }

  async function doDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/clients/${deleting.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast("Could not delete", "Please try again", "err");
        setBusy(false);
        return;
      }
      toast("Client deleted", `${deleting.name} removed from the register`, "err");
      const opts = deleteOpts;
      setDeleting(null);
      setBusy(false);
      afterChange();
      opts.onDeleted?.();
    } catch {
      toast("Network error", "Please try again", "err");
      setBusy(false);
    }
  }

  return (
    <ClientModalContext.Provider value={{ openAdd, openEdit, confirmDelete }}>
      {children}

      {formOpen ? (
        <ClientFormModal
          editing={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            afterChange();
          }}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete this client?"
          message={
            <>
              <b>{deleting.name}</b> and all associated details will be removed.
              This cannot be undone.
            </>
          }
          confirmLabel="Delete client"
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={doDelete}
        />
      ) : null}
    </ClientModalContext.Provider>
  );
}
