import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import backGlyphUrl from "../assets/one-ui/figma/back.svg";
import "./interaction-page.css";

/** App-local page depth; Top App Bar 1495:10799. No route or modal environment. */
export function OneUIInteractionPage({ children, open, onDismiss, onAfterClose, returnFocusRef,
  initialFocusRef, id, title, eyebrow, className = "", presentation = "account", dismissible = true,
}: {
  children: ReactNode; open: boolean; onDismiss: () => void; onAfterClose?: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>; initialFocusRef?: RefObject<HTMLElement | null>;
  id: string; title: string; eyebrow?: string; className?: string;
  presentation?: "search" | "status" | "account"; dismissible?: boolean;
}) {
  const [rendered, setRendered] = useState(open);
  const [entered, setEntered] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const callbacks = useRef({ onDismiss, onAfterClose, dismissible });
  callbacks.current = { onDismiss, onAfterClose, dismissible };
  const wasRendered = useRef(false);
  // Retain the last visible content throughout the reverse transition.
  const lastContent = useRef({ children, title, eyebrow });
  if (open) lastContent.current = { children, title, eyebrow };

  useEffect(() => {
    let frame = 0;
    let nextFrame = 0;
    let timer = 0;
    if (open) {
      setRendered(true);
      frame = requestAnimationFrame(() => {
        nextFrame = requestAnimationFrame(() => setEntered(true));
      });
    } else {
      setEntered(false);
      timer = window.setTimeout(() => setRendered(false),
        matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 280);
    }
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(nextFrame); clearTimeout(timer); };
  }, [open]);

  useLayoutEffect(() => {
    if (!rendered) return;
    const shell = document.querySelector<HTMLElement>(".app-shell");
    const previous = shell?.dataset.interactionPage;
    const fallback = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (shell) shell.dataset.interactionPage = id;
    (initialFocusRef?.current ?? titleRef.current)?.focus({ preventScroll: true });
    return () => {
      if (shell && shell.dataset.interactionPage === id) {
        if (previous === undefined) delete shell.dataset.interactionPage;
        else shell.dataset.interactionPage = previous;
        delete shell.dataset.interactionPhase;
      }
      const target = returnFocusRef?.current ?? fallback;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [rendered, id, initialFocusRef, returnFocusRef]);

  useLayoutEffect(() => {
    const shell = document.querySelector<HTMLElement>(".app-shell");
    if (rendered && shell) shell.dataset.interactionPhase = open ? "active" : "returning";
  }, [open, rendered]);

  useEffect(() => {
    if (wasRendered.current && !rendered) callbacks.current.onAfterClose?.();
    wasRendered.current = rendered;
  }, [rendered]);

  useEffect(() => {
    if (!open) return;
    const back = (event: KeyboardEvent) => {
      // A selection menu or nested confirmation owns its first Escape.
      if (event.defaultPrevented || document.querySelector(".one-ui-select-menu, .one-ui-dialog")) return;
      if (event.key === "Escape" && callbacks.current.dismissible) {
        event.preventDefault();
        callbacks.current.onDismiss();
      }
    };
    document.addEventListener("keydown", back);
    return () => document.removeEventListener("keydown", back);
  }, [open]);

  if (!rendered) return null;
  const content = open ? { children, title, eyebrow } : lastContent.current;
  return createPortal(<section id={id} className={`one-ui-interaction-page ${className}`}
    data-presentation={presentation} data-entered={entered && open} aria-labelledby={`${id}-title`}>
    <header className="one-ui-interaction-page__bar">
      <button
        type="button"
        className="one-ui-interaction-page__back"
        disabled={!dismissible || !open}
        onClick={onDismiss}
        aria-label={`Back from ${title}`}
      >
        <img className="one-ui-interaction-page__back-glyph" src={backGlyphUrl} alt="" aria-hidden="true" />
        <span className="one-ui-interaction-page__back-label">Back from {content.title}</span>
      </button>
      <div className="one-ui-interaction-page__heading">
        <h1 ref={titleRef} id={`${id}-title`} tabIndex={-1}>{content.title}</h1>
        {content.eyebrow && <p>{content.eyebrow}</p>}
      </div>
    </header>
    <div className="one-ui-interaction-page__scroll" inert={!open || undefined}>
      <div className="one-ui-interaction-page__content">{content.children}</div>
    </div>
  </section>, document.body);
}
