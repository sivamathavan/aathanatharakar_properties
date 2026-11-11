"use client";

import { useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Loader2 } from "lucide-react";
import { useT } from "@/components/i18n/I18nProvider";
import { toast } from "@/lib/notify";

export interface ConfirmDialogProps {
  open: boolean;
  /** Called with false when the person cancels or presses Esc (never while busy). */
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel: string;
  /** Shown on the button while onConfirm runs, e.g. "Deleting…". */
  busyLabel?: string;
  cancelLabel?: string;
  /** "danger" for anything that removes, rejects or pauses something. */
  tone?: "danger" | "default";
  /** Extra fields (a reason, a password). */
  children?: React.ReactNode;
  confirmDisabled?: boolean;
  /**
   * Runs when the person confirms. The dialog stays open, with the button busy,
   * until it settles; return false to keep it open (e.g. the server said no and
   * you showed a toast). A thrown error shows the "no internet" toast.
   */
  onConfirm: () => void | boolean | Promise<void | boolean>;
  /** Field to focus first. Default: Cancel for danger, Confirm otherwise. */
  initialFocus?: React.RefObject<HTMLElement | null>;
}

/**
 * The one "are you sure?" dialog. Built on Base UI's AlertDialog: focus moves in
 * and stays inside, Esc cancels, focus goes back to the button that opened it,
 * and screen readers hear the title and description as an alert dialog.
 */
export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel, busyLabel, cancelLabel, tone = "danger",
  children, confirmDisabled, onConfirm, initialFocus,
}: ConfirmDialogProps) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  // Callers often clear the item that filled the title as they close the dialog;
  // keep showing what was there while it fades out.
  const shown = useRef({ title, description, confirmLabel, children });
  if (open) shown.current = { title, description, confirmLabel, children };
  const view = shown.current;

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || confirmDisabled) return;
    setBusy(true);
    try {
      const result = await onConfirm();
      if (result !== false) onOpenChange(false);
    } catch (err) {
      console.error("[CONFIRM]", err);
      toast.error(t("No internet connection. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  const confirmClass =
    tone === "danger"
      ? "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700"
      : "bg-navy-900 text-gold-500 hover:bg-navy-800 focus-visible:ring-navy-900";

  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-[80] bg-navy-950/50 backdrop-blur-[2px] transition-opacity duration-150 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0" />
        <AlertDialog.Viewport className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto p-4">
          <AlertDialog.Popup
            initialFocus={initialFocus || (tone === "danger" ? cancelRef : confirmRef)}
            className="w-full max-w-md rounded-card bg-white p-5 shadow-2xl outline-none transition-[opacity,transform] duration-150 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 font-sans"
          >
            <form onSubmit={run} className="space-y-4">
              <div className="space-y-2">
                <AlertDialog.Title className="text-lg font-bold leading-snug text-navy-900">{view.title}</AlertDialog.Title>
                {view.description && <AlertDialog.Description className="text-sm leading-relaxed text-navy-700">{view.description}</AlertDialog.Description>}
              </div>
              {view.children}
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <AlertDialog.Close
                  ref={cancelRef}
                  disabled={busy}
                  className="h-11 rounded-btn border border-navy-300 px-4 text-sm font-semibold text-navy-900 hover:bg-navy-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-700 focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {cancelLabel || t("Cancel")}
                </AlertDialog.Close>
                <button
                  ref={confirmRef}
                  type="submit"
                  disabled={busy || confirmDisabled}
                  aria-busy={busy || undefined}
                  className={`h-11 rounded-btn px-4 text-sm font-bold inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 ${confirmClass}`}
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  {busy && busyLabel ? busyLabel : view.confirmLabel}
                </button>
              </div>
            </form>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
