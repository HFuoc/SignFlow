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
  const pageRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const callbacks = useRef({ onDismiss, onAfterClose, dismissible });
  callbacks.current = { onDismiss, onAfterClose, dismissible };
  const wasRendered = useRef(false);
  // Retain the last visible content throughout the reverse transition.
  const lastContent = useRef({ children, title, eyebrow });
  if (open) lastContent.current = { children, title, eyebrow };

  useLayoutEffect(() => {
    if (open && !rendered) { setRendered(true); return; }
    const page = pageRef.current;
    if (!rendered || !page) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const from = getComputedStyle(page).transform;
    const to = open ? "translate3d(0, 0, 0)" : "translate3d(100%, 0, 0)";
    const finish = () => { page.style.transform = to; if (!open) setRendered(false); };
    if (reduced.matches) { finish(); return; }
    // One compositor timeline, no double-RAF entrance or timer-based unmount.
    // Freeze the visible position on interruption, so reversing never flashes.
    const x = new DOMMatrixReadOnly(from === "none" ? undefined : from).m41;
    const distance = Math.abs((open ? 0 : page.offsetWidth) - x) / Math.max(1, page.offsetWidth);
    const animation = page.animate([{ transform: from }, { transform: to }], {
      duration: (open ? 400 : 320) * Math.min(1, distance),
      easing: getComputedStyle(page).getPropertyValue("--ou-ease-basic-transform").trim() || "cubic-bezier(.22,.25,0,1)",
      fill: "both",
    });
    animation.onfinish = () => { finish(); animation.cancel(); };
    const onReduced = () => { if (reduced.matches) animation.finish(); };
    reduced.addEventListener("change", onReduced);
    return () => {
      page.style.transform = getComputedStyle(page).transform;
      animation.onfinish = null; animation.cancel();
      reduced.removeEventListener("change", onReduced);
    };
  }, [open, rendered]);

  useLayoutEffect(() => {
    if (!rendered) return;
    const shell = document.querySelector<HTMLElement>(".app-shell, .auth-screen");
    const previous = shell?.dataset.interactionPage;
    const previousInert = shell?.inert ?? false;
    const fallback = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (shell) { shell.dataset.interactionPage = id; shell.inert = true; }
    (initialFocusRef?.current ?? titleRef.current)?.focus({ preventScroll: true });
    return () => {
      if (shell && shell.dataset.interactionPage === id) {
        if (previous === undefined) delete shell.dataset.interactionPage;
        else shell.dataset.interactionPage = previous;
        delete shell.dataset.interactionPhase;
        shell.inert = previousInert;
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
  return createPortal(<section ref={pageRef} id={id} className={`one-ui-interaction-page ${className}`}
    data-presentation={presentation} data-entered={open} aria-labelledby={`${id}-title`}>
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
