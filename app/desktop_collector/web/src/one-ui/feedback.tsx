import closeGlyph from "../assets/one-ui/figma/close.svg";
import errorGlyph from "../assets/one-ui/figma/error-outline.svg";
import infoGlyph from "../assets/one-ui/figma/info-outline.svg";
import checkGlyph from "../assets/one-ui/figma/completed.svg";
import { FigmaIcon } from "./figma-icon";
import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";

import "./feedback.css";

function classes(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function OneUIProgressIndicator({
  className,
  label,
  size = "medium",
  ...props
}: Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  label: string;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span
      {...props}
      className={classes("one-ui-progress-indicator", className)}
      data-size={size}
      role="progressbar"
      aria-label={label}
    />
  );
}

export function OneUIStateMessage({
  action,
  announce = false,
  className,
  description,
  pending = false,
  title,
  tone = "neutral",
}: {
  action?: ReactNode;
  announce?: boolean;
  className?: string;
  description?: ReactNode;
  pending?: boolean;
  title: ReactNode;
  tone?: "neutral" | "error" | "waiting";
}) {
  return (
    <section
      className={classes("one-ui-state-message", className)}
      data-tone={tone}
      aria-busy={pending || undefined}
      role={announce ? (tone === "error" ? "alert" : "status") : undefined}
    >
      {pending
        ? <OneUIProgressIndicator label={typeof title === "string" ? title : "Working"} size="large" />
        : <img className="one-ui-state-message__mark one-ui-feedback-glyph" src={tone === "error" ? errorGlyph : infoGlyph} alt="" />}
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="one-ui-state-message__action">{action}</div> : null}
    </section>
  );
}

export type SnackbarNotice = {
  actionLabel?: string;
  dismissLabel?: string;
  duration?: number | null;
  id: number;
  message: string;
  onAction?: () => void;
  tone: "success" | "error";
};

export function OneUISnackbar({
  duration = 4200,
  notice,
  onDismiss,
}: {
  duration?: number;
  notice: SnackbarNotice | null;
  onDismiss: (id: number) => void;
}) {
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<"opening" | "open" | "closing">("opening");
  const remaining = useRef(duration);
  const startedAt = useRef(0);
  const timeout = notice?.duration === undefined
    ? (notice?.tone === "error" ? null : duration)
    : notice.duration;

  useEffect(() => {
    remaining.current = timeout ?? 0;
    setPaused(false);
  }, [notice?.id, timeout]);

  useEffect(() => {
    if (!notice) return;
    setPhase("opening");
    const frame = window.requestAnimationFrame(() => setPhase("open"));
    return () => window.cancelAnimationFrame(frame);
  }, [notice?.id]);

  const finishDismiss = useCallback(() => {
    if (notice && phase === "closing") onDismiss(notice.id);
  }, [notice, onDismiss, phase]);

  const requestDismiss = useCallback(() => {
    if (!notice || phase === "closing") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onDismiss(notice.id);
      return;
    }
    setPhase("closing");
  }, [notice, onDismiss, phase]);

  useEffect(() => {
    if (!notice || phase !== "closing") return;
    const fallback = window.setTimeout(() => onDismiss(notice.id), 220);
    return () => window.clearTimeout(fallback);
  }, [notice, onDismiss, phase]);

  useEffect(() => {
    if (!notice || paused || timeout == null || phase !== "open") return;
    startedAt.current = performance.now();
    const timer = window.setTimeout(requestDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (performance.now() - startedAt.current));
    };
  }, [notice, paused, phase, requestDismiss, timeout]);

  if (!notice) return null;
  const isError = notice.tone === "error";
  return (
    <div className="one-ui-snackbar-region" role="region" aria-label="Action notifications">
      <div
        className="one-ui-snackbar"
        data-state={phase}
        data-tone={notice.tone}
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        aria-atomic="true"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
        onTransitionEnd={(event) => {
          if (event.currentTarget === event.target && phase === "closing") finishDismiss();
        }}
      >
        <FigmaIcon className="one-ui-snackbar__mark" src={isError ? errorGlyph : checkGlyph} />
        <span className="one-ui-snackbar__message">{notice.message}</span>
        {notice.actionLabel && notice.onAction ? (
          <button
            className="one-ui-snackbar__action"
            type="button"
            onClick={() => {
              notice.onAction?.();
              requestDismiss();
            }}
          >
            {notice.actionLabel}
          </button>
        ) : null}
        <button
          className="one-ui-snackbar__dismiss"
          type="button"
          aria-label={notice.dismissLabel ?? "Dismiss notification"}
          onClick={requestDismiss}
        >
          <img className="one-ui-feedback-glyph" src={closeGlyph} alt="" />
        </button>
      </div>
    </div>
  );
}
