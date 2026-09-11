import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { OneUIButton } from "./controls";
import { OneUIProgressIndicator } from "./feedback";
import "./overlays.css";

const focusableSelector = [
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "a[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

let modalLayerCount = 0;
let modalBaseline: {
  app: HTMLElement | null;
  appAriaHidden: string | null;
  appInert: boolean;
  bodyOverflow: string;
} | null = null;

function acquireModalEnvironment(): () => number {
  if (modalLayerCount === 0) {
    const app = document.querySelector<HTMLElement>(".app-shell");
    modalBaseline = {
      app,
      appAriaHidden: app?.getAttribute("aria-hidden") ?? null,
      appInert: app?.inert ?? false,
      bodyOverflow: document.body.style.overflow,
    };
    document.documentElement.classList.add("one-ui-modal-open");
    document.body.style.overflow = "hidden";
    if (app) {
      app.inert = true;
      app.setAttribute("aria-hidden", "true");
    }
  }
  modalLayerCount += 1;

  let released = false;
  return () => {
    if (released) return modalLayerCount;
    released = true;
    modalLayerCount = Math.max(0, modalLayerCount - 1);
    if (modalLayerCount === 0 && modalBaseline) {
      const baseline = modalBaseline;
      document.documentElement.classList.remove("one-ui-modal-open");
      document.body.style.overflow = baseline.bodyOverflow;
      if (baseline.app) {
        baseline.app.inert = baseline.appInert;
        if (baseline.appAriaHidden == null) baseline.app.removeAttribute("aria-hidden");
        else baseline.app.setAttribute("aria-hidden", baseline.appAriaHidden);
      }
      modalBaseline = null;
    }
    return modalLayerCount;
  };
}

type OverlayPhase = "opening" | "open" | "closing";

function useOverlayPresence(open: boolean, immediate = false): { completeExit: () => void; phase: OverlayPhase; rendered: boolean } {
  const [rendered, setRendered] = useState(open);
  const [phase, setPhase] = useState<OverlayPhase>(open ? "opening" : "closing");
  const [previousOpen, setPreviousOpen] = useState(open);

  // Adjust our own render state before commit, not in a later mount effect.
  // The exit remains mounted, including when an opening is interrupted.
  if (immediate && previousOpen !== open) {
    setPreviousOpen(open);
    setPhase(open ? "opening" : "closing");
    if (open) setRendered(true);
  }

  useEffect(() => {
    let frame = 0;
    let timer = 0;
    if (open) {
      if (immediate) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduceMotion) setPhase("open");
        else timer = window.setTimeout(() => setPhase("open"), 100);
        return () => { if (timer) window.clearTimeout(timer); };
      }
      if (!rendered) {
        setRendered(true);
        return;
      }
      setPhase("opening");
      frame = window.requestAnimationFrame(() => setPhase("open"));
    } else if (rendered) {
      setPhase("closing");
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer = window.setTimeout(() => setRendered(false), reduceMotion ? 0 : 240);
    }
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (timer) window.clearTimeout(timer);
    };
  }, [open, rendered, immediate]);

  const completeExit = useCallback(() => {
    if (!open) setRendered(false);
  }, [open]);
  return { completeExit, phase, rendered };
}

function useSingleDismiss(open: boolean, onDismiss: () => void): () => void {
  const requestedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  useLayoutEffect(() => {
    if (open) requestedRef.current = false;
  }, [open]);
  return useCallback(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    onDismissRef.current();
  }, []);
}

function useModalLayer({
  dismissible,
  onDismiss,
  active,
  panelRef,
  returnFocusRef,
}: {
  dismissible: boolean;
  onDismiss: () => void;
  active: boolean;
  panelRef: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
}) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  useLayoutEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    const fallbackFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const releaseModalEnvironment = acquireModalEnvironment();

    const focusFirst = () => {
      const first = panel?.querySelector<HTMLElement>(focusableSelector);
      (first ?? panel)?.focus();
    };
    focusFirst();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && dismissible) {
        event.preventDefault();
        onDismissRef.current();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      const remainingLayers = releaseModalEnvironment();
      if (remainingLayers === 0) {
        const returnTarget = returnFocusRef?.current ?? fallbackFocus;
        if (returnTarget?.isConnected) returnTarget.focus();
        else document.getElementById("page-title")?.focus();
      }
    };
  }, [active, dismissible, panelRef, returnFocusRef]);
}

export function OneUISideSheet({
  children,
  className,
  dismissLabel = "Close",
  eyebrow,
  id,
  onAfterClose,
  onDismiss,
  open,
  returnFocusRef,
  title,
}: {
  children: ReactNode;
  className?: string;
  dismissLabel?: string;
  eyebrow?: string;
  id?: string;
  onAfterClose?: () => void;
  onDismiss: () => void;
  open: boolean;
  returnFocusRef?: RefObject<HTMLElement | null>;
  title: string;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const generatedId = useId();
  const titleId = `${id ?? generatedId}-title`;
  const { completeExit, phase, rendered } = useOverlayPresence(open, true);
  const requestDismiss = useSingleDismiss(open, onDismiss);
  useModalLayer({ active: rendered, dismissible: true, onDismiss: requestDismiss, panelRef, returnFocusRef });
  const wasRenderedRef = useRef(rendered);
  useEffect(() => {
    const wasRendered = wasRenderedRef.current;
    wasRenderedRef.current = rendered;
    // Modal focus restoration runs in layout cleanup before a destination opens.
    if (wasRendered && !rendered) onAfterClose?.();
  }, [onAfterClose, rendered]);
  if (!rendered) return null;
  return createPortal(
    <div className="one-ui-overlay-layer one-ui-side-sheet-layer" data-state={phase}>
      <div
        className="one-ui-overlay-scrim"
        aria-hidden="true"
        onMouseDown={(event) => event.preventDefault()}
        onClick={requestDismiss}
      />
      <section
        className={`one-ui-side-sheet ${className ?? ""}`.trim()}
        id={id}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-state={phase}
        onTransitionEnd={(event) => {
          if (phase === "closing" && event.currentTarget === event.target) completeExit();
        }}
      >
        <header className="one-ui-side-sheet__header">
          <div>
            {eyebrow ? <span>{eyebrow}</span> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <OneUIButton variant="secondary" onClick={requestDismiss}>{dismissLabel}</OneUIButton>
        </header>
        <div className="one-ui-side-sheet__body">{children}</div>
      </section>
    </div>,
    document.body,
  );
}

export function DialogActionRow({
  cancelLabel,
  confirmLabel,
  destructive,
  onCancel,
  onConfirm,
  pending,
  pendingLabel,
  pendingText,
}: {
  cancelLabel: string;
  confirmLabel: string;
  destructive: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  pendingLabel: string;
  pendingText?: string;
}) {
  return (
    <div className="dialog-action-row" role="group" aria-label="Confirmation actions">
      <button className="dialog-action" type="button" disabled={pending} onClick={onCancel}>
        <span>{cancelLabel}</span>
      </button>
      <span className="dialog-action-row__divider" aria-hidden="true" />
      <button
        className="dialog-action"
        type="button"
        data-destructive={destructive || undefined}
        disabled={pending}
        aria-busy={pending || undefined}
        aria-label={pending ? pendingLabel : confirmLabel}
        onClick={onConfirm}
      >
        {pending ? (
          <>
            <OneUIProgressIndicator label={pendingLabel} size="small" />
            <span>{pendingText ?? confirmLabel}</span>
          </>
        ) : (
          <>
            <span>{confirmLabel}</span>
          </>
        )}
      </button>
    </div>
  );
}

export function OneUIDialog({
  cancelLabel = "Cancel",
  confirmLabel,
  description,
  destructive = false,
  onConfirm,
  onDismiss,
  open,
  pending = false,
  pendingLabel = "Working",
  pendingText,
  returnFocusRef,
  title,
}: {
  cancelLabel?: string;
  confirmLabel: string;
  description: ReactNode;
  destructive?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  open: boolean;
  pending?: boolean;
  pendingLabel?: string;
  pendingText?: string;
  returnFocusRef?: RefObject<HTMLElement | null>;
  title: string;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const titleId = `${useId()}-title`;
  const descriptionId = `${titleId}-description`;
  const { completeExit, phase, rendered } = useOverlayPresence(open);
  const requestDismiss = useSingleDismiss(open, onDismiss);
  useModalLayer({ active: rendered, dismissible: !pending, onDismiss: requestDismiss, panelRef, returnFocusRef });
  if (!rendered) return null;
  return createPortal(
    <div className="one-ui-overlay-layer one-ui-dialog-layer" data-state={phase}>
      <div
        className="one-ui-overlay-scrim"
        aria-hidden="true"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => { if (!pending) requestDismiss(); }}
      />
      <section
        className="one-ui-dialog"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        data-state={phase}
        onTransitionEnd={(event) => {
          if (phase === "closing" && event.currentTarget === event.target) completeExit();
        }}
      >
        <div className="one-ui-dialog__content">
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
        </div>
        <DialogActionRow
          cancelLabel={cancelLabel}
          confirmLabel={confirmLabel}
          destructive={destructive}
          onCancel={requestDismiss}
          onConfirm={onConfirm}
          pending={pending}
          pendingLabel={pendingLabel}
          pendingText={pendingText}
        />
      </section>
    </div>,
    document.body,
  );
}
