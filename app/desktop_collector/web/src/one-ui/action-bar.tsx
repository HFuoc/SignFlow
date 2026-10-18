import type { ReactNode } from "react";
import "./action-bar.css";

/** Paired real commands. One UI Action Bar 1677:9974 / 1677:9973,
 * adapted from 52px to the approved desktop control scale. */
export function OneUIActionBar({ children, label }: { children: ReactNode; label: string }) {
  return <div className="one-ui-action-bar" role="group" aria-label={label}>{children}</div>;
}
